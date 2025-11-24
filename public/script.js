// Ana JavaScript dosyası - Tüm fonksiyonlar burada

// Global değişken
let currentLanguage = 'en';
let currentPaymentMethod = 'usdt';
let bnbPrice = 0;

// Tokenomics Chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('tokenomicsChart').getContext('2d');
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
                    '#22c55e',
                    '#06b6d4',
                    '#8b5cf6',
                    '#f97316',
                    '#eab308',
                    '#ef4444',
                    '#3b82f6'
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

    // Sayfa yüklendiğinde dili ayarla
    const savedLang = localStorage.getItem('preferred-language') || 'en';
    currentLanguage = savedLang;
    changeLanguage(savedLang);
    
    // Aktif dil butonunu ayarla
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === savedLang) {
            btn.classList.add('active');
        }
    });

    // Dil butonlarına event listener ekle - DÜZELTİLDİ
    document.querySelectorAll('.lang-btn').forEach(button => {
        button.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            
            // Tüm butonlardan active classını kaldır
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Sadece tıklanana active classını ekle
            this.classList.add('active');
            
            changeLanguage(lang);
        });
    });

    // FAQ Toggle Function
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // Payment method switcher - DÜZELTİLDİ
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const bnbPriceInfo = document.getElementById('bnbPriceInfo');

    paymentButtons.forEach(button => {
        button.addEventListener('click', function() {
            paymentButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentPaymentMethod = this.getAttribute('data-method');
            
            // BNB fiyat bilgisini göster/gizle
            if (currentPaymentMethod === 'bnb') {
                bnbPriceInfo.classList.add('visible');
            } else {
                bnbPriceInfo.classList.remove('visible');
            }
            
            calculatePayment();
        });
    });

    // Connect wallet button
    const connectButton = document.querySelector('.connect-wallet');
    connectButton.addEventListener('click', function() {
        alert('Wallet connection functionality will be implemented soon!');
    });

    // Buy button
    const buyButton = document.querySelector('.btn-primary');
    buyButton.addEventListener('click', function() {
        alert('Purchase functionality will be implemented after wallet integration!');
    });

    // BNB Price Calculator
    const snakeAmountInput = document.getElementById('snakeAmount');
    const youPayElement = document.getElementById('youPay');
    const youReceiveElement = document.getElementById('youReceive');
    const bnbPriceElement = document.getElementById('bnbPrice');

    // Fetch live BNB price from Binance
    async function fetchBNBPrice() {
        try {
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ Loading...`;
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
            const data = await response.json();
            bnbPrice = parseFloat(data.price);
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ ${bnbPrice.toFixed(2)} USDT`;
            calculatePayment(); // Fiyat geldiğinde hesaplamayı güncelle
            return bnbPrice;
        } catch (error) {
            console.error('Error fetching BNB price:', error);
            bnbPrice = 854.51;
            bnbPriceElement.textContent = `Current reference: 1 BNB ≈ ${bnbPrice.toFixed(2)} USDT`;
            calculatePayment(); // Fiyat geldiğinde hesaplamayı güncelle
            return bnbPrice;
        }
    }

    // Calculate payment amount - DÜZELTİLDİ
    function calculatePayment() {
        const snakeAmount = parseFloat(snakeAmountInput.value) || 0;
        const snakePrice = 0.02; // USDT
        
        youReceiveElement.textContent = `${snakeAmount.toLocaleString()} SNAKE`;
        
        if (currentPaymentMethod === 'usdt') {
            const totalUSDT = snakeAmount * snakePrice;
            youPayElement.textContent = `${totalUSDT.toFixed(2)} USDT`;
        } else if (currentPaymentMethod === 'bnb' && bnbPrice > 0) {
            const totalUSDT = snakeAmount * snakePrice;
            const totalBNB = totalUSDT / bnbPrice;
            youPayElement.textContent = `${totalBNB.toFixed(6)} BNB`;
        } else if (currentPaymentMethod === 'bnb') {
            youPayElement.textContent = `Loading...`;
        }
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize
    fetchBNBPrice().then(() => {
        calculatePayment();
    });
    
    snakeAmountInput.addEventListener('input', calculatePayment);

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
});

// Dil değiştirme fonksiyonu - GÜNCELLENDİ
function changeLanguage(lang) {
    currentLanguage = lang;
    
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
}

// Chart etiketlerini güncelleyen fonksiyon
function updateChartLabels(lang) {
    if (window.tokenomicsChart) {
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