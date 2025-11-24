// Ana JavaScript dosyası - Tüm fonksiyonlar burada

// Global değişkenler
let currentLanguage = 'en';
let currentPaymentMethod = 'usdt';
let bnbPrice = 0;

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi - dil:', currentLanguage);
    
    // Tokenomics Chart
    initChart();
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Sayfayı başlat
    initializePage();
});

function initChart() {
    const canvas = document.getElementById('tokenomicsChart');
    if (!canvas) {
        console.error('Chart canvas bulunamadı!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context alınamadı!');
        return;
    }
    
    window.tokenomicsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                translations['en']['tokenomics.presale'],
                translations['en']['tokenomics.liquidity'], 
                translations['en']['tokenomics.staking'],
                translations['en']['tokenomics.marketing'],
                translations['en']['tokenomics.team'],
                translations['en']['tokenomics.reserve'],
                translations['en']['tokenomics.community']
            ],
            datasets: [{
                data: [25, 20, 15, 15, 10, 10, 5],
                backgroundColor: [
                    '#22c55e', '#06b6d4', '#8b5cf6', '#f97316', 
                    '#eab308', '#ef4444', '#3b82f6'
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#B0B0B0',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function setupEventListeners() {
    console.log('Event listenerlar kuruluyor...');

    // 🔹 Hamburger menü
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }
    
    // 🔹 Dil butonları
    const langButtons = document.querySelectorAll('.lang-btn');
    console.log('Bulunan dil butonları:', langButtons.length);
    
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Dil butonuna tıklandı:', this.getAttribute('data-lang'));
            const lang = this.getAttribute('data-lang');
            
            // Tüm butonlardan active classını kaldır
            langButtons.forEach(btn => btn.classList.remove('active'));
            
            // Sadece tıklanana active classını ekle
            this.classList.add('active');
            
            changeLanguage(lang);
        });
    });

    // 🔹 Payment method butonları
    const paymentButtons = document.querySelectorAll('.payment-btn');
    paymentButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Payment butonuna tıklandı:', this.getAttribute('data-method'));
            paymentButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentPaymentMethod = this.getAttribute('data-method');
            toggleBnbPriceInfo();
            calculatePayment();
        });
    });

    // 🔹 FAQ toggle
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // 🔹 Diğer butonlar
    const connectWalletBtn = document.querySelector('.connect-wallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', function() {
            alert('Wallet connection functionality will be implemented soon!');
        });
    }

    const buyNowBtn = document.querySelector('.btn-primary');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function() {
            alert('Purchase functionality will be implemented after wallet integration!');
        });
    }

    // 🔹 Input event
    const snakeAmountInput = document.getElementById('snakeAmount');
    if (snakeAmountInput) {
        snakeAmountInput.addEventListener('input', calculatePayment);
    }

    // 🔹 Smooth scroll + mobil menü kapatma
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Eğer mobil menü açıksa linke tıklayınca kapat
            if (navLinks && navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
            }
        });
    });

    // 🔹 Scroll event (header arka plan)
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (!header) return;

        if (window.scrollY > 100) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
}

function initializePage() {
    // Kayıtlı dili yükle
    const savedLang = localStorage.getItem('preferred-language') || 'en';
    currentLanguage = savedLang;
    
    // Aktif dil butonunu ayarla
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === savedLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Sayfayı çevir
    changeLanguage(savedLang);
    
    // BNB fiyatını getir
    fetchBNBPrice();
}

function toggleBnbPriceInfo() {
    const bnbPriceInfo = document.getElementById('bnbPriceInfo');
    if (!bnbPriceInfo) return;

    if (currentPaymentMethod === 'bnb') {
        bnbPriceInfo.classList.add('visible');
    } else {
        bnbPriceInfo.classList.remove('visible');
    }
}

async function fetchBNBPrice() {
    try {
        const bnbPriceElement = document.getElementById('bnbPrice');
        if (bnbPriceElement) {
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ Loading...`;
        }
        
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const data = await response.json();
        bnbPrice = parseFloat(data.price);
        
        if (bnbPriceElement) {
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ ${bnbPrice.toFixed(2)} USDT`;
        }
        calculatePayment();
        
    } catch (error) {
        console.error('Error fetching BNB price:', error);
        bnbPrice = 854.51;
        const bnbPriceElement = document.getElementById('bnbPrice');
        if (bnbPriceElement) {
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ ${bnbPrice.toFixed(2)} USDT`;
        }
        calculatePayment();
    }
}

function calculatePayment() {
    const snakeAmountInput = document.getElementById('snakeAmount');
    const youReceiveEl = document.getElementById('youReceive');
    const youPayEl = document.getElementById('youPay');

    if (!snakeAmountInput || !youReceiveEl || !youPayEl) return;

    const snakeAmount = parseFloat(snakeAmountInput.value) || 0;
    const snakePrice = 0.02;
    
    youReceiveEl.textContent = `${snakeAmount.toLocaleString()} SNAKE`;
    
    if (currentPaymentMethod === 'usdt') {
        const totalUSDT = snakeAmount * snakePrice;
        youPayEl.textContent = `${totalUSDT.toFixed(2)} USDT`;
    } else if (currentPaymentMethod === 'bnb' && bnbPrice > 0) {
        const totalUSDT = snakeAmount * snakePrice;
        const totalBNB = totalUSDT / bnbPrice;
        youPayEl.textContent = `${totalBNB.toFixed(6)} BNB`;
    } else if (currentPaymentMethod === 'bnb') {
        youPayEl.textContent = `Loading...`;
    }
}

function changeLanguage(lang) {
    console.log('Dil değiştiriliyor:', lang);
    currentLanguage = lang;
    
    if (!translations[lang]) {
        console.error('Çeviri dili bulunamadı:', lang);
        return;
    }

    // Tüm çeviri elementlerini güncelle
    Object.keys(translations[lang]).forEach(key => {
        const elements = document.querySelectorAll(`[data-translate="${key}"]`);
        elements.forEach(element => {
            element.textContent = translations[lang][key];
        });
    });

    // Placeholder'ları güncelle
    const inputField = document.getElementById('snakeAmount');
    if (inputField && translations[lang]['presale.enter-amount']) {
        inputField.placeholder = translations[lang]['presale.enter-amount'];
    }

    // Price display güncelle
    const priceDisplay = document.getElementById('priceDisplay');
    if (priceDisplay && translations[lang]['presale.price']) {
        priceDisplay.textContent = translations[lang]['presale.price'];
    }

    // Chart etiketlerini güncelle
    updateChartLabels(lang);

    // Aktif dili kaydet
    localStorage.setItem('preferred-language', lang);
    
    console.log('Dil değiştirme tamamlandı:', lang);
}

function updateChartLabels(lang) {
    if (window.tokenomicsChart && translations[lang]) {
        window.tokenomicsChart.data.labels = [
            translations[lang]['tokenomics.presale'],
            translations[lang]['tokenomics.liquidity'], 
            translations[lang]['tokenomics.staking'],
            translations[lang]['tokenomics.marketing'],
            translations[lang]['tokenomics.team'],
            translations[lang]['tokenomics.reserve'],
            translations[lang]['tokenomics.community']
        ];
        window.tokenomicsChart.update();
    }
}
