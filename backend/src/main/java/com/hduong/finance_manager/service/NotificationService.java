package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.NotificationResponse;
import com.hduong.finance_manager.entity.Notification;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.ForbiddenException;
import com.hduong.finance_manager.exception.NotFoundException;
import com.hduong.finance_manager.repository.NotificationRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public List<NotificationResponse> getAll() {
        User user = getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    public long getUnreadCount() {
        User user = getCurrentUser();
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(Long id) {
        User user = getCurrentUser();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Access denied");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead() {
        User user = getCurrentUser();
        notificationRepository.markAllReadByUserId(user.getId());
    }

    @Transactional
    public void delete(Long id) {
        User user = getCurrentUser();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Access denied");
        }
        notificationRepository.delete(n);
    }

    @Transactional
    public void deleteAll() {
        User user = getCurrentUser();
        notificationRepository.deleteAllByUserId(user.getId());
    }

    /**
     * Called internally by schedulers / other services to create a notification.
     * Deduplicates: skips if the same type was already created within the last hour,
     * except for AI_INSIGHT which is always allowed through.
     */
    @Transactional
    public void create(User user, Notification.NotificationType type, String title, String message) {
        LocalDateTime since = LocalDateTime.now().minusHours(1);
        long recent = notificationRepository.countRecentByType(user.getId(), type, since);
        if (recent > 0 && type != Notification.NotificationType.AI_INSIGHT) {
            log.debug("Skipping duplicate notification {} for user {}", type, user.getId());
            return;
        }
        Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .build();
        notificationRepository.save(n);
        log.info("Created notification {} for user {}", type, user.getId());
    }
}
