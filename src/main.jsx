import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// 뷰포트 크기에 맞게 폰 프레임 자동 축소
function applyPhoneScale() {
  const PHONE_W = 390;
  const PHONE_H = 844;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scaleX = vw / PHONE_W;
  const scaleY = vh / PHONE_H;
  const scale = Math.min(scaleX, scaleY, 1); // 최대 1 (원본보다 크게는 X)
  document.documentElement.style.setProperty('--phone-scale', scale.toFixed(3));
}

applyPhoneScale();
window.addEventListener('resize', applyPhoneScale);

// Note: StrictMode removed to prevent double-invocation of streaming API calls
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
