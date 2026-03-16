<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and validate input
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $phone = strip_tags(trim($_POST["phone"]));
    $service = strip_tags(trim($_POST["service"]));
    $message = strip_tags(trim($_POST["message"]));

    // Email configuration
    // TODO: Replace with your actual email address
    $to = "info@profinishglassandbody.com"; 
    $subject = "New Quote Request from $name";

    // Build the email content
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n";
    $email_content .= "Phone: $phone\n";
    $email_content .= "Service Needed: $service\n\n";
    $email_content .= "Message:\n$message\n";

    // Email headers
    $headers = "From: $name <$email>";

    // Send email
    if (mail($to, $subject, $email_content, $headers)) {
        // Redirect back to the home page with a success parameter
        header("Location: index.html?status=success");
    } else {
        header("Location: index.html?status=error");
    }
} else {
    // If accessed directly without POST, redirect home
    header("Location: index.html");
}
?>