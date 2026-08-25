package com.hduong.finance_manager.ai;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.hduong.finance_manager.ai.dto.AiChatResponse;
import com.hduong.finance_manager.ai.dto.ParsedTransactionDto;
import com.hduong.finance_manager.ai.dto.SmartInputResponse;
import com.hduong.finance_manager.entity.Transaction;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.AiServiceException;
import com.hduong.finance_manager.exception.BadRequestException;
import com.hduong.finance_manager.repository.TransactionRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient openAiWebClient;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-3.6-flash}")
    private String model;

    @Value("${gemini.api.max-tokens:1000}")
    private int maxTokens;

    @PostConstruct
    public void validateConfig() {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("============================================================");
            log.error("GEMINI API KEY IS NOT CONFIGURED — AI features will fail.");
            log.error("Set env var: GEMINI_API_KEY=<your-key>");
            log.error("Get a key at: https://aistudio.google.com/app/apikey");
            log.error("============================================================");
        } else {
            log.info("Gemini AI configured — model: {}, maxTokens: {}", model, maxTokens);
        }
    }

    // ── get current user ──────────────────────────────────
    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    // ── build financial summary ───────────────────────────
    private String buildFinancialSummary(User user) {
        var pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "date"));
        List<Transaction> recent = transactionRepository.findByUserId(user.getId(), pageable).getContent();

        BigDecimal totalIncome  = transactionRepository.sumByUserIdAndType(user.getId(), Transaction.TransactionType.INCOME);
        BigDecimal totalExpense = transactionRepository.sumByUserIdAndType(user.getId(), Transaction.TransactionType.EXPENSE);
        BigDecimal balance      = totalIncome.subtract(totalExpense);

        LocalDate now = LocalDate.now();
        var monthly = transactionRepository.findByUserIdAndDateBetween(
                user.getId(), now.withDayOfMonth(1), now, PageRequest.of(0, 100));

        BigDecimal monthIncome = monthly.getContent().stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthExpense = monthly.getContent().stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        StringBuilder txList = new StringBuilder();
        for (Transaction t : recent) {
            txList.append(String.format("- [%s] %s: %,.0f VND (%s) | Ghi chú: %s%n",
                    t.getDate(),
                    t.getType() == Transaction.TransactionType.INCOME ? "Thu" : "Chi",
                    t.getAmount(),
                    t.getCategory() != null ? t.getCategory().getName() : "Không rõ",
                    t.getNote() != null ? t.getNote() : "—"));
        }

        return String.format("""
                === DỮ LIỆU TÀI CHÍNH CỦA NGƯỜI DÙNG ===
                Tên: %s

                TỔNG QUAN:
                - Tổng thu nhập: %,.0f VND
                - Tổng chi tiêu: %,.0f VND
                - Số dư hiện tại: %,.0f VND

                THÁNG %d/%d:
                - Thu nhập tháng này: %,.0f VND
                - Chi tiêu tháng này: %,.0f VND

                20 GIAO DỊCH GẦN NHẤT:
                %s
                ==========================================
                """,
                user.getFullName(),
                totalIncome, totalExpense, balance,
                now.getMonthValue(), now.getYear(),
                monthIncome, monthExpense,
                txList);
    }

    // ── extract meaningful error from Gemini JSON body ────
    private String extractGeminiErrorMessage(String body) {
        try {
            ObjectMapper m = new ObjectMapper();
            Map<?, ?> parsed = m.readValue(body, Map.class);
            Object error = parsed.get("error");
            if (error instanceof Map<?, ?> errMap) {
                Object msg = errMap.get("message");
                if (msg != null) return msg.toString();
            }
        } catch (Exception ignored) { /* fall through */ }
        return body.length() > 300 ? body.substring(0, 300) : body;
    }

    // ── call Gemini API ───────────────────────────────────
    @SuppressWarnings("unchecked")
    private AiChatResponse callGemini(String systemPrompt, String userMessage) {
        ensureKeyConfigured();
        log.info("Calling Gemini API — model: {}", model);

        String fullPrompt = systemPrompt + "\n\nCâu hỏi: " + userMessage;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", fullPrompt)))),
                "generationConfig", Map.of("maxOutputTokens", maxTokens, "temperature", 0.7));

        String url = "/" + model + ":generateContent";

        Map<String, Object> response = openAiWebClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError(),
                        clientResponse -> clientResponse
                                .bodyToMono(String.class)
                                .defaultIfEmpty("(empty body)")
                                .flatMap(body -> {
                                    String geminiMsg = extractGeminiErrorMessage(body);
                                    log.error("Gemini 4xx — status: {}, message: {}",
                                            clientResponse.statusCode(), geminiMsg);
                                    return Mono.error(new AiServiceException(
                                            "AI service error (" + clientResponse.statusCode() + "): " + geminiMsg));
                                }))
                .onStatus(
                        status -> status.is5xxServerError(),
                        clientResponse -> clientResponse
                                .bodyToMono(String.class)
                                .defaultIfEmpty("(empty body)")
                                .flatMap(body -> {
                                    log.error("Gemini 5xx — body: {}", body);
                                    return Mono.error(new AiServiceException(
                                            "AI service temporarily unavailable — please try again later"));
                                }))
                .bodyToMono(Map.class)
                .block();

        return parseGeminiResponse(response);
    }

    // ── parse Gemini generateContent response ─────────────
    @SuppressWarnings("unchecked")
    private AiChatResponse parseGeminiResponse(Map<String, Object> response) {
        if (response == null) {
            throw new AiServiceException("Empty response from Gemini");
        }

        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) response.get("candidates");

        if (candidates == null || candidates.isEmpty()) {
            // Safety block: Gemini returns promptFeedback instead of candidates
            Object feedback = response.get("promptFeedback");
            String reason = "No candidates returned";
            if (feedback instanceof Map<?, ?> fb && fb.get("blockReason") != null) {
                reason = "Blocked by safety filter: " + fb.get("blockReason");
            }
            throw new AiServiceException("AI could not generate a response — " + reason);
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new AiServiceException("AI response missing content field");
        }

        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new AiServiceException("AI response missing text parts");
        }

        String reply = (String) parts.get(0).get("text");
        if (reply == null || reply.isBlank()) {
            throw new AiServiceException("AI returned empty text");
        }

        Map<String, Object> usage = (Map<String, Object>) response.get("usageMetadata");
        int promptTokens     = usage != null ? ((Number) usage.getOrDefault("promptTokenCount",     0)).intValue() : 0;
        int completionTokens = usage != null ? ((Number) usage.getOrDefault("candidatesTokenCount", 0)).intValue() : 0;

        log.info("Gemini response OK — prompt: {}, completion: {}", promptTokens, completionTokens);

        return AiChatResponse.builder()
                .reply(reply.trim())
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .build();
    }

    // ── system prompt ─────────────────────────────────────
    private String buildSystemPrompt(String financialSummary) {
        return String.format("""
                Bạn là một trợ lý tài chính cá nhân thông minh tên là "FinBot".

                NHIỆM VỤ:
                - Phân tích dữ liệu tài chính của người dùng
                - Đưa ra lời khuyên tài chính ngắn gọn, thực tế
                - Trả lời bằng tiếng Việt
                - Phản hồi ngắn gọn (tối đa 3-5 câu)
                - Thân thiện, dễ hiểu

                QUY TẮC:
                - Chỉ tư vấn về tài chính cá nhân
                - Không bịa đặt số liệu
                - Khi đưa ra cảnh báo phải có số liệu cụ thể

                %s
                """, financialSummary);
    }

    // ── guard: key must be set before any Gemini call ─────
    private void ensureKeyConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiServiceException(
                    "AI service is not configured — Gemini API key is missing. " +
                    "Set GEMINI_API_KEY environment variable.");
        }
    }

    // ── public methods ────────────────────────────────────
    public AiChatResponse chat(String userMessage) {
        User user = getCurrentUser();
        log.info("AI chat — user: {}", user.getEmail());
        return callGemini(buildSystemPrompt(buildFinancialSummary(user)), userMessage);
    }

    public AiChatResponse generateInsights() {
        User user = getCurrentUser();
        log.info("AI insights — user: {}", user.getEmail());
        String prompt = """
                Dựa vào dữ liệu tài chính của tôi, hãy:
                1. Nhận xét tổng quan tình hình tài chính
                2. Chỉ ra 1-2 điểm cần cải thiện
                3. Đưa ra 1 lời khuyên cụ thể để tiết kiệm
                """;
        return callGemini(buildSystemPrompt(buildFinancialSummary(user)), prompt);
    }

    public AiChatResponse autoCategorize(String note, String amount) {
        log.info("AI categorize — note: {}", note);
        String systemPrompt = """
                Bạn là hệ thống phân loại giao dịch tài chính.
                Danh mục: Food, Transport, Education, Entertainment,
                Healthcare, Salary, Shopping, Utilities, Other.
                Chỉ trả về đúng tên danh mục, không giải thích.
                """;
        String userMessage = String.format("Phân loại: \"%s\"%s", note,
                amount != null ? " | Số tiền: " + amount : "");
        return callGemini(systemPrompt, userMessage);
    }

    // ── smart parse prompt ────────────────────────────────
    private String buildParsePrompt(String userText) {
        String today = LocalDate.now().toString();
        return String.format("""
                Bạn là hệ thống phân tích giao dịch tài chính tự động.

                Hôm nay là: %s

                DANH MỤC HỢP LỆ:
                - Food (ăn uống, đồ ăn, nhà hàng, cafe)
                - Transport (xăng, taxi, xe ôm, grab, vé xe)
                - Education (học phí, sách, khóa học)
                - Entertainment (phim, game, du lịch)
                - Healthcare (thuốc, bệnh viện, khám bệnh)
                - Salary (lương, thưởng, thu nhập)
                - Shopping (quần áo, điện tử, mua sắm)
                - Utilities (điện, nước, internet, điện thoại)
                - Other (không thuộc danh mục trên)

                QUY TẮC QUAN TRỌNG:
                - Trích xuất TẤT CẢ giao dịch trong văn bản
                - Chuyển đổi số tiền: "40k" = 40000, "1.5tr" = 1500000
                - Nếu không rõ loại → mặc định là EXPENSE
                - Nếu không rõ ngày → dùng ngày hôm nay: %s
                - Không bịa thêm thông tin không có trong văn bản
                - description = mô tả ngắn gọn bằng tiếng Việt

                TRẢ VỀ CHỈ JSON THUẦN, KHÔNG GIẢI THÍCH, KHÔNG MARKDOWN:
                [
                  {
                    "description": "Ăn phở",
                    "amount": 40000,
                    "type": "EXPENSE",
                    "category": "Food",
                    "date": "%s",
                    "note": "Ăn phở buổi sáng"
                  }
                ]

                Văn bản cần phân tích:
                "%s"
                """, today, today, today, userText);
    }

    // ── parse natural language input ──────────────────────
    public SmartInputResponse parseSmartInput(String text) {
        ensureKeyConfigured();
        log.info("Smart input parse — text length: {}", text.length());

        String url = "/" + model + ":generateContent";

        Map response = openAiWebClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .bodyValue(Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", buildParsePrompt(text))))),
                        "generationConfig", Map.of("maxOutputTokens", 2000, "temperature", 0.1)))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse
                                .bodyToMono(String.class)
                                .defaultIfEmpty("(empty body)")
                                .flatMap(body -> {
                                    String geminiMsg = extractGeminiErrorMessage(body);
                                    log.error("Gemini smart-input error — status: {}, message: {}",
                                            clientResponse.statusCode(), geminiMsg);
                                    return Mono.error(new AiServiceException(
                                            "AI service error (" + clientResponse.statusCode() + "): " + geminiMsg));
                                }))
                .bodyToMono(Map.class)
                .block();

        String raw = extractGeminiText(response);
        log.info("Smart input raw: {}", raw);

        List<ParsedTransactionDto> transactions = parseJsonTransactions(raw);
        return SmartInputResponse.builder()
                .transactions(transactions)
                .count(transactions.size())
                .summary(String.format("Tìm thấy %d giao dịch từ văn bản", transactions.size()))
                .build();
    }

    // ── scan receipt image ────────────────────────────────
    public SmartInputResponse scanReceipt(String base64Image, String mimeType) {
        ensureKeyConfigured();
        log.info("Receipt scan request");

        String today = LocalDate.now().toString();
        String prompt = String.format("""
                Phân tích hóa đơn/biên lai trong ảnh này.
                Hôm nay là: %s

                DANH MỤC: Food, Transport, Education,
                Entertainment, Healthcare, Salary, Shopping, Utilities, Other

                QUY TẮC:
                - Trích xuất tất cả mặt hàng và giá tiền
                - Mỗi mặt hàng = một giao dịch riêng
                - Tất cả là EXPENSE trừ khi rõ ràng là thu nhập
                - Dùng ngày hôm nay nếu không có ngày trên hóa đơn
                - Không bịa thêm thông tin

                TRẢ VỀ CHỈ JSON THUẦN:
                [{"description":"...","amount":0,"type":"EXPENSE","category":"Food","date":"%s","note":"..."}]
                """, today, today);

        String mime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/jpeg";
        String url  = "/" + model + ":generateContent";

        Map response = openAiWebClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .bodyValue(Map.of(
                        "contents", List.of(Map.of("parts", List.of(
                                Map.of("text", prompt),
                                Map.of("inline_data", Map.of("mime_type", mime, "data", base64Image))))),
                        "generationConfig", Map.of("maxOutputTokens", 2000, "temperature", 0.1)))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse
                                .bodyToMono(String.class)
                                .defaultIfEmpty("(empty body)")
                                .flatMap(body -> {
                                    String geminiMsg = extractGeminiErrorMessage(body);
                                    log.error("Gemini scan-receipt error — status: {}, message: {}",
                                            clientResponse.statusCode(), geminiMsg);
                                    return Mono.error(new AiServiceException(
                                            "AI service error (" + clientResponse.statusCode() + "): " + geminiMsg));
                                }))
                .bodyToMono(Map.class)
                .block();

        String raw = extractGeminiText(response);
        log.info("Receipt scan raw: {}", raw);

        List<ParsedTransactionDto> transactions = parseJsonTransactions(raw);
        return SmartInputResponse.builder()
                .transactions(transactions)
                .count(transactions.size())
                .summary("Tìm thấy " + transactions.size() + " mặt hàng từ hóa đơn")
                .build();
    }

    // ── helpers ───────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map response) {
        if (response == null) return "[]";
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "[]";
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) return "[]";
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) return "[]";
        Object text = parts.get(0).get("text");
        return text != null ? text.toString() : "[]";
    }

    private List<ParsedTransactionDto> parseJsonTransactions(String raw) {
        try {
            String cleaned = raw
                    .replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*", "")
                    .trim();

            int start = cleaned.indexOf('[');
            int end   = cleaned.lastIndexOf(']');
            if (start == -1 || end == -1 || end <= start) return new ArrayList<>();

            String json = cleaned.substring(start, end + 1);
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, new TypeReference<List<ParsedTransactionDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse AI JSON response: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
