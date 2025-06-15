function openLogin() {
    newWindow = window.open(
        'http://tfg.zenken.es/login',
        'LoginWindow',
        'width=400,height=800,scrollbars=yes,resizable=yes'
    );
}

function signOut() {
    fetch('http://tfg.zenken.es/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            window.location.href = 'http://tfg.zenken.es/v2/index.html';
        } else {
            console.error('Logout failed');
        }
    })
    .catch(error => console.error('Error:', error));
}