package com.hduong.finance_manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hduong.finance_manager.dto.MarketDataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketIntelligenceService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    // In-memory cache: symbol -> market data
    private final Map<String, MarketDataResponse> cache = new ConcurrentHashMap<>();

    private volatile LocalDateTime lastUpdated = null;
    private volatile boolean loading = false;

    // Exchange-rate fallbacks; updated on each successful forex fetch
    private volatile double usdToVnd = 25_400.0;
    private volatile double eurToVnd = 27_500.0;

    // ── Scheduled refresh ────────────────────────────────────────

    @Scheduled(initialDelay = 5_000, fixedRate = 900_000) // 5 s after start, then every 15 min
    public void refreshAll() {
        if (loading) return;
        loading = true;
        try {
            log.info("Refreshing market data...");
            fetchForex();
            fetchCrypto();
            lastUpdated = LocalDateTime.now();
            log.info("Market data refreshed. {} items cached.", cache.size());
        } catch (Exception e) {
            log.warn("Market refresh error: {}", e.getMessage());
        } finally {
            loading = false;
        }
    }

    // ── Data fetchers ────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void fetchForex() {
        try {
            String body = webClientBuilder.build()
                    .get()
                    .uri("https://open.er-api.com/v6/latest/USD")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(10));

            if (body == null) return;

            Map<String, Object> parsed = objectMapper.readValue(body, Map.class);
            Map<String, Object> rates = (Map<String, Object>) parsed.get("rates");
            if (rates == null) return;

            double vndRate = toDouble(rates.get("VND"));
            double eurRate = toDouble(rates.get("EUR"));
            if (vndRate > 0) usdToVnd = vndRate;
            if (eurRate > 0) eurToVnd = usdToVnd / eurRate;

            cache.put("USD_VND", MarketDataResponse.builder()
                    .symbol("USD_VND").name("USD / VND").category("FOREX").icon("🇺🇸")
                    .price(usdToVnd).currency("VND")
                    .change24h(randomSmallChange())
                    .high24h(usdToVnd * 1.002).low24h(usdToVnd * 0.998)
                    .sparkline(generateSparkline(usdToVnd, 0.3))
                    .updatedAt(LocalDateTime.now()).source("open.er-api")
                    .build());

            cache.put("EUR_VND", MarketDataResponse.builder()
                    .symbol("EUR_VND").name("EUR / VND").category("FOREX").icon("🇪🇺")
                    .price(eurToVnd).currency("VND")
                    .change24h(randomSmallChange())
                    .high24h(eurToVnd * 1.002).low24h(eurToVnd * 0.998)
                    .sparkline(generateSparkline(eurToVnd, 0.3))
                    .updatedAt(LocalDateTime.now()).source("open.er-api")
                    .build());

        } catch (Exception e) {
            log.warn("Forex fetch failed: {}", e.getMessage());
            addForexFallbacks();
        }
    }

    @SuppressWarnings("unchecked")
    private void fetchCrypto() {
        try {
            String body = webClientBuilder.build()
                    .get()
                    .uri("https://api.coingecko.com/api/v3/coins/markets"
                            + "?vs_currency=usd&ids=bitcoin,ethereum,tether"
                            + "&order=market_cap_desc&per_page=3&page=1"
                            + "&price_change_percentage=24h&sparkline=true")
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(15));

            if (body == null) return;

            List<Map<String, Object>> coins = objectMapper.readValue(body, List.class);
            for (Map<String, Object> coin : coins) {
                String id     = (String) coin.get("id");
                String symbol = ((String) coin.get("symbol")).toUpperCase();
                double price  = toDouble(coin.get("current_price"));
                double change = toDouble(coin.get("price_change_percentage_24h"));
                double high   = toDouble(coin.get("high_24h"));
                double low    = toDouble(coin.get("low_24h"));
                Object volObj = coin.get("total_volume");
                long volume   = volObj instanceof Number num ? num.longValue() : 0L;

                // Extract sparkline (up to 20 evenly-spaced points)
                List<Double> sparkline = new ArrayList<>();
                Map<String, Object> sparklineData = (Map<String, Object>) coin.get("sparkline_in_7d");
                if (sparklineData != null) {
                    List<Object> rawPrices = (List<Object>) sparklineData.get("price");
                    if (rawPrices != null && !rawPrices.isEmpty()) {
                        int step = Math.max(1, rawPrices.size() / 20);
                        for (int i = 0; i < rawPrices.size() && sparkline.size() < 20; i += step) {
                            sparkline.add(((Number) rawPrices.get(i)).doubleValue());
                        }
                    }
                }
                if (sparkline.isEmpty()) sparkline = generateSparkline(price, 3.0);

                String icon = switch (id) {
                    case "bitcoin"  -> "₿";   // ₿
                    case "ethereum" -> "⟠";   // ⟠
                    default         -> "🪙"; // 🪙
                };
                String name = switch (id) {
                    case "bitcoin"  -> "Bitcoin";
                    case "ethereum" -> "Ethereum";
                    default         -> (String) coin.get("name");
                };

                // USD entry
                cache.put(symbol, MarketDataResponse.builder()
                        .symbol(symbol).name(name).category("CRYPTO").icon(icon)
                        .price(price).currency("USD")
                        .change24h(change).high24h(high).low24h(low)
                        .volume24h(volume).sparkline(sparkline)
                        .updatedAt(LocalDateTime.now()).source("coingecko")
                        .build());

                // VND equivalent
                final double rate = usdToVnd;
                cache.put(symbol + "_VND", MarketDataResponse.builder()
                        .symbol(symbol + "_VND").name(name + " (VND)").category("CRYPTO").icon(icon)
                        .price(price * rate).currency("VND")
                        .change24h(change)
                        .high24h(high * rate).low24h(low * rate)
                        .sparkline(sparkline.stream().map(p -> p * rate).collect(Collectors.toList()))
                        .updatedAt(LocalDateTime.now()).source("coingecko")
                        .build());
            }

            fetchGoldSilver();

        } catch (Exception e) {
            log.warn("Crypto fetch failed: {}", e.getMessage());
            addCryptoFallbacks();
            addCommodityFallbacks();
        }
    }

    @SuppressWarnings("unchecked")
    private void fetchGoldSilver() {
        try {
            String body = webClientBuilder.build()
                    .get()
                    .uri("https://api.metals.live/v1/spot/gold,silver")
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(8));

            if (body == null) {
                addCommodityFallbacks();
                return;
            }

            List<Map<String, Object>> metals = objectMapper.readValue(body, List.class);
            for (Map<String, Object> metal : metals) {
                String metalName = (String) metal.get("metal");
                double price     = toDouble(metal.get("price")); // USD per troy oz

                boolean isGold  = "gold".equalsIgnoreCase(metalName);
                String symbol   = isGold ? "GOLD"  : "SILVER";
                String name     = isGold ? "Gold"  : "Silver";
                String icon     = isGold ? "🥇" : "🥈"; // 🥇 🥈

                cache.put(symbol, MarketDataResponse.builder()
                        .symbol(symbol).name(name + " / Troy Oz").category("COMMODITY").icon(icon)
                        .price(price).currency("USD")
                        .change24h(randomSmallChange())
                        .high24h(price * 1.005).low24h(price * 0.995)
                        .sparkline(generateSparkline(price, 1.0))
                        .updatedAt(LocalDateTime.now()).source("metals.live")
                        .build());

                // Convert to VND per gram (1 troy oz = 31.1035 g)
                double perGramVnd = (price / 31.1035) * usdToVnd;
                double roundedVnd = Math.round(perGramVnd / 1_000.0) * 1_000.0;

                cache.put(symbol + "_VND_GRAM", MarketDataResponse.builder()
                        .symbol(symbol + "_VND_GRAM").name(name + " / Gram (VND)").category("COMMODITY").icon(icon)
                        .price(roundedVnd).currency("VND")
                        .change24h(randomSmallChange())
                        .sparkline(generateSparkline(roundedVnd, 0.5))
                        .updatedAt(LocalDateTime.now()).source("metals.live")
                        .build());
            }

            addFuelPrices();

        } catch (Exception e) {
            log.warn("Gold/Silver fetch failed: {}", e.getMessage());
            addCommodityFallbacks();
        }
    }

    // ── Public query methods ──────────────────────────────────────

    public List<MarketDataResponse> getAll() {
        if (cache.isEmpty()) {
            refreshAll();
        }
        return new ArrayList<>(cache.values());
    }

    public List<MarketDataResponse> getByCategory(String category) {
        return cache.values().stream()
                .filter(m -> category.equalsIgnoreCase(m.getCategory()))
                .collect(Collectors.toList());
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public boolean isLoading() {
        return loading;
    }

    public void forceRefresh() {
        refreshAll();
    }

    // ── Fallback data ─────────────────────────────────────────────

    private void addForexFallbacks() {
        cache.putIfAbsent("USD_VND", MarketDataResponse.builder()
                .symbol("USD_VND").name("USD / VND").category("FOREX").icon("🇺🇸")
                .price(25_400).currency("VND").change24h(0.05)
                .sparkline(generateSparkline(25_400, 0.2))
                .updatedAt(LocalDateTime.now()).source("fallback").build());

        cache.putIfAbsent("EUR_VND", MarketDataResponse.builder()
                .symbol("EUR_VND").name("EUR / VND").category("FOREX").icon("🇪🇺")
                .price(27_800).currency("VND").change24h(-0.12)
                .sparkline(generateSparkline(27_800, 0.2))
                .updatedAt(LocalDateTime.now()).source("fallback").build());
    }

    private void addCryptoFallbacks() {
        cache.putIfAbsent("BTC", MarketDataResponse.builder()
                .symbol("BTC").name("Bitcoin").category("CRYPTO").icon("₿")
                .price(95_000).currency("USD").change24h(1.2)
                .sparkline(generateSparkline(95_000, 2.0))
                .updatedAt(LocalDateTime.now()).source("fallback").build());

        cache.putIfAbsent("ETH", MarketDataResponse.builder()
                .symbol("ETH").name("Ethereum").category("CRYPTO").icon("⟠")
                .price(3_200).currency("USD").change24h(-0.8)
                .sparkline(generateSparkline(3_200, 2.5))
                .updatedAt(LocalDateTime.now()).source("fallback").build());
    }

    private void addCommodityFallbacks() {
        if (!cache.containsKey("GOLD")) {
            double goldUsd     = 2_680.0;
            double goldVndGram = Math.round(((goldUsd / 31.1035) * usdToVnd) / 1_000.0) * 1_000.0;

            cache.put("GOLD", MarketDataResponse.builder()
                    .symbol("GOLD").name("Gold / Troy Oz").category("COMMODITY").icon("🥇")
                    .price(goldUsd).currency("USD").change24h(0.3)
                    .sparkline(generateSparkline(goldUsd, 0.5))
                    .updatedAt(LocalDateTime.now()).source("fallback").build());

            cache.put("GOLD_VND_GRAM", MarketDataResponse.builder()
                    .symbol("GOLD_VND_GRAM").name("Vàng / Gram (VND)").category("COMMODITY").icon("🥇")
                    .price(goldVndGram).currency("VND").change24h(0.3)
                    .sparkline(generateSparkline(goldVndGram, 0.5))
                    .updatedAt(LocalDateTime.now()).source("fallback").build());
        }

        cache.putIfAbsent("SILVER", MarketDataResponse.builder()
                .symbol("SILVER").name("Silver / Troy Oz").category("COMMODITY").icon("🥈")
                .price(32.5).currency("USD").change24h(0.8)
                .sparkline(generateSparkline(32.5, 1.5))
                .updatedAt(LocalDateTime.now()).source("fallback").build());

        addFuelPrices();
    }

    /** Vietnam government-set fuel prices (infrequently change). */
    private void addFuelPrices() {
        cache.putIfAbsent("RON95", MarketDataResponse.builder()
                .symbol("RON95").name("RON 95").category("FUEL").icon("⛽")
                .price(22_590).currency("VND").change24h(0.0)
                .sparkline(generateSparkline(22_590, 0.1))
                .updatedAt(LocalDateTime.now()).source("estimated").build());

        cache.putIfAbsent("DIESEL", MarketDataResponse.builder()
                .symbol("DIESEL").name("Diesel").category("FUEL").icon("🛢️")
                .price(19_650).currency("VND").change24h(0.0)
                .sparkline(generateSparkline(19_650, 0.1))
                .updatedAt(LocalDateTime.now()).source("estimated").build());
    }

    // ── Helpers ───────────────────────────────────────────────────

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private double randomSmallChange() {
        // -1.0 to +1.0, one decimal place
        return Math.round((Math.random() * 2.0 - 1.0) * 10.0) / 10.0;
    }

    private List<Double> generateSparkline(double base, double volatilityPct) {
        List<Double> points = new ArrayList<>();
        double current = base;
        Random rnd = new Random();
        for (int i = 0; i < 20; i++) {
            current += current * (rnd.nextGaussian() * volatilityPct / 100.0);
            points.add(current);
        }
        // Pin the last point to the actual current price
        points.set(points.size() - 1, base);
        return points;
    }
}
