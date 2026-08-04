package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for sending user notification emails (Approval Activation, Rejection, Password Reset).
 * Supports real SMTP email delivery via JavaMailSender + fallback console logging.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:your_email@gmail.com}")
    private String mailFrom;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Sends account approval notification email with username and temporary password.
     */
    public void sendApprovalEmail(User user, String tempPassword) {
        String loginUrl = frontendUrl + "/login";
        String subject = "🎉 Account Approved - Your Login Credentials | Carbon Footprint Tracker";
        String content = String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your account registration has been APPROVED by the administrator.\n\n" +
                "Here are your login credentials:\n" +
                "👤 Username / Email: %s\n" +
                "🔑 Temporary Password: %s\n\n" +
                "Please log in at:\n" +
                "👉 %s\n\n" +
                "Upon logging in with this temporary password, a window will pop up prompting you to set your new permanent password.\n\n" +
                "Best regards,\n" +
                "Carbon Footprint Team",
                user.getFullName(), user.getEmail(), tempPassword, loginUrl
        );

        sendEmailOrLog(user.getEmail(), subject, content, loginUrl);
    }

    /**
     * Sends registration email with temporary password.
     */
    public void sendRegistrationTempPasswordEmail(User user, String tempPassword) {
        String loginUrl = frontendUrl + "/login";
        String subject = "🎉 Welcome to Carbon Footprint Tracker - Your Temporary Credentials";
        String content = String.format(
                "Dear %s,\n\n" +
                "Thank you for registering with the Carbon Footprint Tracker platform!\n\n" +
                "Here are your temporary login credentials:\n" +
                "👤 Username / Email: %s\n" +
                "🔑 Temporary Password: %s\n\n" +
                "Please log in at:\n" +
                "👉 %s\n\n" +
                "Upon logging in with this temporary password, a window will pop up prompting you to set your new permanent password.\n\n" +
                "Best regards,\n" +
                "Carbon Footprint Team",
                user.getFullName(), user.getEmail(), tempPassword, loginUrl
        );

        sendEmailOrLog(user.getEmail(), subject, content, loginUrl);
    }

    /**
     * Sends account rejection notification email.
     */
    public void sendRejectionEmail(User user) {
        String subject = "Account Registration Status Update | Carbon Footprint Tracker";
        String content = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that your registration request could not be approved at this time.\n\n" +
                "If you believe this is an error, please contact our support team.\n\n" +
                "Best regards,\n" +
                "Carbon Footprint Team",
                user.getFullName()
        );

        sendEmailOrLog(user.getEmail(), subject, content, null);
    }

    /**
     * Sends password reset token email.
     */
    public void sendForgotPasswordEmail(User user, String resetToken) {
        String resetPasswordUrl = frontendUrl + "/reset-password?token=" + resetToken;
        String subject = "Password Reset Request | Carbon Footprint Tracker";
        String content = String.format(
                "Dear %s,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Click the link below to set a new password:\n" +
                "👉 %s\n\n" +
                "If you did not request a password reset, please ignore this message.\n\n" +
                "Best regards,\n" +
                "Carbon Footprint Team",
                user.getFullName(), resetPasswordUrl
        );

        sendEmailOrLog(user.getEmail(), subject, content, resetPasswordUrl);
    }

    private void sendEmailOrLog(String to, String subject, String body, String actionUrl) {
        // Log to console for instant developer access
        logger.info("\n=======================================================");
        logger.info("📧 [NOTIFICATION EMAIL]");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        if (actionUrl != null) {
            logger.info("🔗 ACTIVATION LINK: {}", actionUrl);
        }
        logger.info("=======================================================\n");

        if (mailSender != null && !mailFrom.contains("your_email@gmail.com")) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                logger.info("Real email successfully delivered via SMTP to {}", to);
            } catch (Exception e) {
                logger.warn("Could not send SMTP email to {}: {}. (Token link is logged above)", to, e.getMessage());
            }
        }
    }
}
