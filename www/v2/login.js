function openLogin() {
    var windowSize = "width=" + window.innerWidth + ",height=" + window.innerHeight + ",scrollbars=no";
    newWindow = window.open(
        'http://tfg.zenken.es/login',
        'popup',
        windowSize
    );
}

function signOut() {
    fetch('https://tfg.zenken.es/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            window.location.href = 'https://tfg.zenken.es/version2.html';
        } else {
            console.error('Logout failed');
        }
    })
    .catch(error => console.error('Error:', error));
}