async function submitJson(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Ошибка запроса' }));
    throw new Error(data.message || 'Ошибка запроса');
  }
  return res.json();
}

function bindAuthForms() {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const downloadForm = document.getElementById('download-form');
  const logoutForm = document.getElementById('logout-form');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alert = document.getElementById('register-alert');
      alert.hidden = true;
      try {
        const formData = new FormData(registerForm);
        await submitJson('/api/auth/register', {
          email: formData.get('email'),
          password: formData.get('password')
        });
        alert.textContent = 'Вы успешно зарегистрированы. Перенаправляем...';
        alert.className = 'form__alert form__alert--success';
        alert.hidden = false;
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      } catch (error) {
        alert.textContent = error.message;
        alert.className = 'form__alert form__alert--error';
        alert.hidden = false;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alert = document.getElementById('login-alert');
      alert.hidden = true;
      try {
        const formData = new FormData(loginForm);
        await submitJson('/api/auth/login', {
          email: formData.get('email'),
          password: formData.get('password')
        });
        alert.textContent = 'Авторизация успешна. Перенаправляем...';
        alert.className = 'form__alert form__alert--success';
        alert.hidden = false;
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 400);
      } catch (error) {
        alert.textContent = error.message;
        alert.className = 'form__alert form__alert--error';
        alert.hidden = false;
      }
    });
  }

  if (logoutForm) {
    logoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  }

  if (downloadForm) {
    downloadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alert = document.getElementById('download-alert');
      const result = document.getElementById('download-result');
      alert.hidden = true;
      result.hidden = false;
      result.innerHTML = '<p class="muted">Подготовка ссылки...</p>';
      try {
        const formData = new FormData(downloadForm);
        const payload = {
          url: formData.get('url'),
          quality: formData.get('quality')
        };

        const response = await fetch('/api/download', {
          method: 'POST',
          body: new URLSearchParams(payload)
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
          throw new Error(data.message || 'Не удалось скачать видео');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'video';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        result.innerHTML = '<p class="muted">Загрузка запущена ✅</p>';
      } catch (error) {
        alert.textContent = error.message;
        alert.className = 'form__alert form__alert--error';
        alert.hidden = false;
        result.hidden = true;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', bindAuthForms);
