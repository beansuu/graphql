export function showErrorNotification(message) {
    const notification = createNotificationElement(message, 'error-notification');
    animateNotification(notification);
}
function createNotificationElement(message, className) {
    const notification = document.createElement('div');
    notification.className = className;
    notification.innerText = message;
    document.body.appendChild(notification);
    return notification;
}
function animateNotification(notification) {
    notificationsQueue.push(notification);
    requestAnimationFrame(() => {
        notification.classList.add('show');
        updateNotificationsPosition();
    });
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            notificationsQueue = notificationsQueue.filter(n => n !== notification);
            updateNotificationsPosition();
        }, 500);
    }, 5000);
}
function updateNotificationsPosition() {
    notificationsQueue.forEach((notif, index) => {
        notif.style.top = `${10 + 60 * index}px`;
    });
}
let notificationsQueue = [];