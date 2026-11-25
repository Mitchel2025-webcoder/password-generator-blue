const lengthInput = document.querySelector('#length');
const lengthValue = document.querySelector('#length-value');

const updateLength = () => {
  lengthValue.textContent = lengthInput.value;
  const range = Number(lengthInput.max) - Number(lengthInput.min);
  const percent = ((Number(lengthInput.value) - Number(lengthInput.min)) / range) * 100;
  lengthInput.style.setProperty('--fill', `${percent}%`);
};

lengthInput.addEventListener('input', updateLength);
updateLength();

const form = document.querySelector('#generator-form');
const passwordInput = document.querySelector('#password');
const errorMessage = document.querySelector('#error');
const strengthMeter = document.querySelector('#strength');

const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
};

const randomInt = (max) => {
  const limit = Math.floor(2 ** 32 / max) * max;
  const array = new Uint32Array(1);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
};

const generatePassword = (length, selectedTypes) => {
  const pool = selectedTypes.map((type) => characterSets[type]).join('');

  const password = selectedTypes.map((type) => {
    const set = characterSets[type];
    return set[randomInt(set.length)];
  });

  while (password.length < length) {
    password.push(pool[randomInt(pool.length)]);
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

const getStrength = (length, selectedTypes) => {
  const poolSize = selectedTypes.reduce((sum, type) => sum + characterSets[type].length, 0);
  const bits = length * Math.log2(poolSize);
  return Math.min(100, Math.round(bits));
};

const setStrength = (percent) => {
  strengthMeter.value = percent;
  strengthMeter.style.setProperty('--strength-fill', `${percent}%`);
  strengthMeter.style.setProperty('--strength-hue', percent * 1.3);
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedTypes = Array.from(
    form.querySelectorAll('input[type="checkbox"]:checked'),
    (checkbox) => checkbox.name
  );

  if (selectedTypes.length === 0) {
    errorMessage.hidden = false;
    passwordInput.value = '';
    setStrength(0);
    return;
  }

  errorMessage.hidden = true;
  passwordInput.value = generatePassword(Number(lengthInput.value), selectedTypes);
  setStrength(getStrength(Number(lengthInput.value), selectedTypes));
});

const copyButton = document.querySelector('#copy-btn');
const copyStatus = document.querySelector('#copy-status');
let statusTimeout;

const showStatus = (message) => {
  copyStatus.textContent = message;
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
};

copyButton.addEventListener('click', async () => {
  if (!passwordInput.value) {
    showStatus('Generate a password first.');
    return;
  }

  try {
    await navigator.clipboard.writeText(passwordInput.value);
    showStatus('Copied!');
  } catch {
    showStatus('Could not copy. Select the text and copy it manually.');
  }
});

const themeToggle = document.querySelector('#theme-toggle');
const darkQuery = matchMedia('(prefers-coclor-scheme: dark)');
const THEME_KEY = 'password-generator-theme';

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark Mode';
};

const storedTheme = localStorage.getItem(THEME_KEY);
const initialTheme =
  storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : darkQuery.matches ? 'dark' : 'light';

applyTheme(initialTheme);

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

  const change = () => {
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduceMotion) {
    change();
    return;
  }

  document.startViewTransition(change);
});