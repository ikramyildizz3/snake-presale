// Dil çevirisi sistemi
const translations = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.tokenomics': 'Tokenomics',
        'nav.roadmap': 'Roadmap',
        'nav.how-to-buy': 'How to Buy',
        'nav.faq': 'FAQ',
        'connect.wallet': 'Connect Wallet',

        // Hero Section
        'hero.presale': 'Snake Token Presale',
        'hero.title': 'Snake Token: Play-to-Earn Focused',
        'hero.title2': 'BNB Chain Ecosystem Token',
        'hero.description': 'Community-focused, transparent token distribution and real in-game usage - we aim for sustainable demand, not hype.',
        'hero.total-supply': 'Total Supply',
        'hero.presale-price': 'Presale Price',
        'hero.network': 'Network',

        // Presale Details
        'presale.soft-cap': 'Soft Cap:',
        'presale.hard-cap': 'Hard Cap:',
        'presale.min-max': 'Minimum Buy:',

        // Presale Panel
        'presale.title': 'Presale Panel',
        'presale.subtitle': 'Buy SNAKE tokens before listing',
        'presale.amount': 'Amount (SNAKE)',
        'presale.price': 'Price: 1 SNAKE = 0.02 USDT',
        'presale.enter-amount': 'Enter amount',
        'presale.you-pay': 'You pay (estimated)',
        'presale.you-receive': 'You receive',
        'presale.buy-now': 'Buy Now',
        'presale.claim': 'Claim (Soon)',
        'presale.bnb-note': 'If you choose BNB, an indicative live rate from Binance is used. Final price is confirmed on-chain at the time of purchase.',

        // Warning Message - EKLENDİ
        'warning.direct-transfer': '⚠ Important: Do not send funds directly from an exchange to the presale contract. Always use your own Web3 wallet.',

        // Section Titles
        'section.tokenomics': 'Tokenomics',
        'section.tokenomics.sub': 'Transparent and sustainable token distribution',
        'section.roadmap': 'Roadmap',
        'section.roadmap.sub': 'Our strategic plan for growth and development',
        'section.how-to-buy': 'How to Buy Snake Token',
        'section.how-to-buy.sub': 'Step-by-step guide to purchase SNAKE tokens',
        'section.faq': 'Frequently Asked Questions',
        'section.faq.sub': 'Everything you need to know about Snake Token',

        // Tokenomics
        'tokenomics.presale': 'Presale',
        'tokenomics.liquidity': 'Liquidity',
        'tokenomics.staking': 'Staking & Rewards',
        'tokenomics.marketing': 'Marketing',
        'tokenomics.team': 'Team & Advisors',
        'tokenomics.reserve': 'Reserve',
        'tokenomics.community': 'Airdrop & Community',

        // Roadmap
        'roadmap.phase1': 'Phase 1 - Completed',
        'roadmap.phase1.title': 'Foundation & Launch',
        'roadmap.phase1.item1': 'Smart contract development and audit',
        'roadmap.phase1.item2': 'Website and branding launch',
        'roadmap.phase1.item3': 'Community building initiatives',
        'roadmap.phase1.item4': 'Presale platform development',

        'roadmap.phase2': 'Phase 2 - In Progress',
        'roadmap.phase2.title': 'Presale & Growth',
        'roadmap.phase2.item1': 'Public presale launch',
        'roadmap.phase2.item2': 'Marketing and partnership expansion',
        'roadmap.phase2.item3': 'Exchange listings preparation',
        'roadmap.phase2.item4': 'Game development initiation',

        'roadmap.phase3': 'Phase 3 – Game & Utility Expansion (Q2–Q3 2026)',
        'roadmap.phase3.title': 'Ecosystem Development',
        'roadmap.phase3.item1': 'PancakeSwap listing and liquidity',
        'roadmap.phase3.item2': 'Staking platform launch',
        'roadmap.phase3.item3': 'Play-to-Earn game beta testing',
        'roadmap.phase3.item4': 'Major CEX listing negotiations',

        'roadmap.phase4': 'Phase 4 – Ecosystem Growth (Q4 2026 and beyond)',
        'roadmap.phase4.title': 'Global Scaling',
        'roadmap.phase4.item1': 'Full game launch with Play-to-Earn',
        'roadmap.phase4.item2': 'Tier 1 exchange listings',
        'roadmap.phase4.item3': 'Mobile app development',
        'roadmap.phase4.item4': 'Cross-chain integration',

        // Steps
        'steps.step1.title': 'Setup Wallet',
        'steps.step1.desc': 'Install MetaMask, Trust Wallet, Binance Web3 Wallet, or any Web3 wallet. Make sure you\'re on Binance Smart Chain network.',
        'steps.step2.title': 'Get BNB or USDT',
        'steps.step2.desc': 'Deposit BNB or USDT (BEP-20) into your wallet. Binance Web3 Wallet users: You can easily bridge assets from other chains.',
        'steps.step3.title': 'Connect & Buy',
        'steps.step3.desc': 'Connect your wallet to our presale platform, enter the SNAKE amount, and confirm the transaction.',
        'steps.step4.title': 'Claim Tokens',
        'steps.step4.desc': 'After presale ends, return to claim your SNAKE tokens. They\'ll be automatically sent to your connected wallet.',

        // Binance Wallet
        'binance.title': 'For Binance Web3 Wallet Users',
        'binance.feature1': 'Easy Setup',
        'binance.desc1': 'Built into Binance App - no separate installation needed',
        'binance.feature2': 'Simple Bridging',
        'binance.desc2': 'Easily move assets between chains with low fees',
        'binance.feature3': 'Enhanced Security',
        'binance.desc3': 'Backed by Binance\'s security infrastructure',
        'binance.feature4': 'One-Click Connect',
        'binance.desc4': 'Seamless connection to dApps like our presale',

        // FAQ
        'faq.q1': 'What is Snake Token?',
        'faq.a1': 'Snake Token is a community-driven meme token on Binance Smart Chain with real utility through upcoming Play-to-Earn gaming integration.',
        'faq.q2': 'How can I buy Snake Token?',
        'faq.a2': 'During presale: Connect your wallet and use USDT or BNB. After launch: Available on PancakeSwap.',
        'faq.q3': 'When is the game launching?',
        'faq.a3': 'Target Launch: Q2–Q3 2026 - Our Play-to-Earn Snake game is in active development.',
        'faq.q4': 'What is the total supply?',
        'faq.a4': 'Total supply is 400,000,000 SNAKE tokens with fair distribution.',
        'faq.q5': 'Where will SNAKE be listed?',
        'faq.a5.1': 'Initially on PancakeSwap on BNB Chain.',
        'faq.a5.2': 'You will be able to trade SNAKE via Web3 wallets like MetaMask, Trust Wallet and Binance Web3 by connecting to PancakeSwap.',
        'faq.a5.3': 'In later phases, we plan major CEX listings after the game launch.',

        'faq.q6': 'How can I see SNAKE in my wallet?',
        'faq.a6.1': 'After you buy or claim SNAKE, the tokens are linked to your wallet address on BNB Chain.',
        'faq.a6.2': 'To make them visible in your wallet app, you may need to add the token manually as a custom token.',
        'faq.a6.3': 'Binance Web3 Wallet: Open Binance → Wallet → Web3 Wallet → tap “+” (Add Token), select BNB Smart Chain, paste the SNAKE contract address 0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7 and confirm. Other wallets (MetaMask, Trust Wallet, SafePal): Use “Add Custom Token” on BNB Chain with the same address, symbol SNAKE and 18 decimals.',

        // Sale Types
        'section.sales': 'Sale Types',
        'section.sales.sub': 'Choose the presale model that fits your strategy.',
        'sales.normal.title': 'Normal Presale (No Vesting)',
        'sales.normal.tag': 'Flexible, short/mid-term',
        'sales.normal.item1': 'Price: 1 SNAKE = 0.02 USDT',
        'sales.normal.item2': 'Payment: BNB or USDT (BEP-20)',
        'sales.normal.item3': 'Vesting: None',
        'sales.normal.item4': 'Distribution: 100% claimable after TGE in a single transaction.',
        'sales.vesting.title': 'Vesting Presale (Discounted Price)',
        'sales.vesting.tag': 'Lower price, vesting schedule',
        'sales.vesting.item1': 'Price: 1 SNAKE = 0.015 USDT',
        'sales.vesting.item2': 'Payment: BNB or USDT (BEP-20)',
        'sales.vesting.item3': 'Vesting: 30% at TGE, 70% over 7 months (10% per month).',
        'sales.vesting.item4': 'Distribution: Investors claim the unlocked portion via the presale panel during the vesting period.',

        // Legal - Terms of Service
        'legal.terms': 'Terms of Service',
        'legal.terms.intro': 'By using this website and interacting with the Snake Token ecosystem, you agree to the following terms:',
        'legal.terms.eligibility': 'Eligibility',
        'legal.terms.eligibility.desc': 'You must be of legal age and legally allowed to participate in cryptocurrency-related activities in your jurisdiction.',
        'legal.terms.info': 'Information Only – No Advice',
        'legal.terms.info.desc': 'All content on this website is provided for informational and educational purposes only. Nothing here constitutes financial, investment, legal, or tax advice. Always do your own research before making any decision.',
        'legal.terms.guarantees': 'No Guarantees or Returns',
        'legal.terms.guarantees.desc': 'Snake Token is an experimental community project. We do not guarantee any price, profit, return, or future value of the token or related products.',
        'legal.terms.responsibility': 'User Responsibility',
        'legal.terms.responsibility.desc': 'You are fully responsible for the security of your wallet, private keys, and transactions. We cannot recover lost or stolen funds and have no control over the blockchain.',
        'legal.terms.prohibited': 'Prohibited Use',
        'legal.terms.prohibited.desc': 'You agree not to use this website or the Snake Token ecosystem for any illegal activity, including money laundering, fraud, or sanctions violations.',
        'legal.terms.changes': 'Changes to the Website and Terms',
        'legal.terms.changes.desc': 'We may update or modify this website and these Terms of Service at any time without prior notice. Your continued use of the site after changes means you accept the updated terms.',

        // Legal - Other
        'legal.disclaimer': 'Important Risk Disclaimer',
        'legal.warning': 'Investment Warning:',
        'legal.warning-desc': 'Snake Token is an experimental community project. Cryptocurrency investments are highly volatile and risky. Only invest what you can afford to lose.',
        'legal.advice': 'No Financial Advice:',
        'legal.advice-desc': 'This website does not constitute financial advice. Always do your own research (DYOR) before investing.',
        'legal.privacy': 'Privacy Policy',
        'legal.updated': 'Last Updated:',
        'legal.updated.date': 'November 2025',
        'legal.privacy-desc': 'We do not collect personal information. Our website is static and does not use tracking cookies. When connecting your wallet, we only access public blockchain information.',

        // Footer
        'footer.desc': 'A community-driven cryptocurrency with innovative tokenomics and real utility on the Binance Smart Chain.',
        'footer.resources': 'Resources',
        'footer.legal': 'Legal'
    },
    tr: {
        // Navigation
        'nav.home': 'Ana Sayfa',
        'nav.tokenomics': 'Tokenomik',
        'nav.roadmap': 'Yol Haritası',
        'nav.how-to-buy': 'Nasıl Alınır',
        'nav.faq': 'SSS',
        'connect.wallet': 'Cüzdanı Bağla',

        // Hero Section
        'hero.presale': 'Snake Token Ön Satışı',
        'hero.title': 'Snake Token: Play-to-Earn Odaklı',
        'hero.title2': 'BNB Chain Ekosistem Tokeni',
        'hero.description': 'Topluluk odaklı, şeffaf token dağılımı ve gerçek oyun içi kullanım - hype değil, sürdürülebilir talep hedefliyoruz.',
        'hero.total-supply': 'Toplam Arz',
        'hero.presale-price': 'Ön Satış Fiyatı',
        'hero.network': 'Ağ',

        // Presale Details
        'presale.soft-cap': 'Soft Cap:',
        'presale.hard-cap': 'Hard Cap:',
        'presale.min-max': 'Minimum Alım:',

        // Presale Panel
        'presale.title': 'Ön Satış Paneli',
        'presale.subtitle': 'Listeleme öncesi SNAKE tokenlerini satın alın',
        'presale.amount': 'Miktar (SNAKE)',
        'presale.price': 'Fiyat: 1 SNAKE = 0.02 USDT',
        'presale.enter-amount': 'Miktar girin',
        'presale.you-pay': 'Ödeyeceğiniz tutar (tahmini)',
        'presale.you-receive': 'Alacağınız miktar',
        'presale.buy-now': 'Hemen Satın Al',
        'presale.claim': 'Claim (Yakında)',
        'presale.bnb-note': 'BNB seçerseniz, Binance\'ten canlı gösterge oranı kullanılır. Son fiyat işlem anında on-chain olarak onaylanır.',

        // Warning Message - EKLENDİ
        'warning.direct-transfer': '⚠ Önemli: Fonları doğrudan borsadan ön satış kontratına göndermeyin. Her zaman kendi Web3 cüzdanınızı kullanın.',

        // Section Titles
        'section.tokenomics': 'Tokenomik',
        'section.tokenomics.sub': 'Şeffaf ve sürdürülebilir token dağılımı',
        'section.roadmap': 'Yol Haritası',
        'section.roadmap.sub': 'Büyüme ve gelişim için stratejik planımız',
        'section.how-to-buy': 'Snake Token Nasıl Alınır',
        'section.how-to-buy.sub': 'SNAKE tokenlerini satın alma rehberi',
        'section.faq': 'Sık Sorulan Sorular',
        'section.faq.sub': 'Snake Token hakkında bilmeniz gereken her şey',

        // Tokenomics
        'tokenomics.presale': 'Ön Satış',
        'tokenomics.liquidity': 'Likidite',
        'tokenomics.staking': 'Staking & Ödüller',
        'tokenomics.marketing': 'Marketing',
        'tokenomics.team': 'Ekip & Danışmanlar',
        'tokenomics.reserve': 'Rezerv',
        'tokenomics.community': 'Airdrop & Topluluk',

        // Roadmap
        'roadmap.phase1': 'Faz 1 - Tamamlandı',
        'roadmap.phase1.title': 'Temel & Lansman',
        'roadmap.phase1.item1': 'Smart contract geliştirme ve denetim',
        'roadmap.phase1.item2': 'Web sitesi ve marka lansmanı',
        'roadmap.phase1.item3': 'Topluluk oluşturma girişimleri',
        'roadmap.phase1.item4': 'Ön satış platformu geliştirme',

        'roadmap.phase2': 'Faz 2 - Devam Ediyor',
        'roadmap.phase2.title': 'Ön Satış & Büyüme',
        'roadmap.phase2.item1': 'Halka açık ön satış başlangıcı',
        'roadmap.phase2.item2': 'Marketing ve ortaklık genişlemesi',
        'roadmap.phase2.item3': 'Borsa listeleme hazırlıkları',
        'roadmap.phase2.item4': 'Oyun geliştirme başlangıcı',

        'roadmap.phase3': 'Faz 3 – Oyun & Utility Genişleme (2.-3. Çeyrek 2026)',
        'roadmap.phase3.title': 'Ekosistem Geliştirme',
        'roadmap.phase3.item1': 'PancakeSwap listeleme ve likidite',
        'roadmap.phase3.item2': 'Staking platformu lansmanı',
        'roadmap.phase3.item3': 'Play-to-Earn oyun beta testi',
        'roadmap.phase3.item4': 'Büyük CEX listeleme görüşmeleri',

        'roadmap.phase4': 'Faz 4 – Ekosistem Büyüme (4. Çeyrek 2026 ve Sonrası)',
        'roadmap.phase4.title': 'Küresel Ölçeklenme',
        'roadmap.phase4.item1': 'Play-to-Earn ile tam oyun lansmanı',
        'roadmap.phase4.item2': 'Tier 1 borsa listeleri',
        'roadmap.phase4.item3': 'Mobil uygulama geliştirme',
        'roadmap.phase4.item4': 'Cross-chain entegrasyon',

        // Steps
        'steps.step1.title': 'Cüzdan Kurulumu',
        'steps.step1.desc': 'MetaMask, Trust Wallet, Binance Web3 Wallet veya herhangi bir Web3 cüzdanını yükleyin. Binance Smart Chain ağında olduğunuzdan emin olun.',
        'steps.step2.title': 'BNB veya USDT Alın',
        'steps.step2.desc': 'Cüzdanınıza BNB veya USDT (BEP-20) yatırın. Binance Web3 Wallet kullanıcıları: Diğer ağlardan varlıkları kolayca taşıyabilir.',
        'steps.step3.title': 'Bağlan & Satın Al',
        'steps.step3.desc': 'Cüzdanınızı ön satış platformumuza bağlayın, SNAKE miktarını girip işlemi onaylayın.',
        'steps.step4.title': 'Tokenleri Claim Et',
        'steps.step4.desc': 'Ön satış sona erdikten sonra, SNAKE tokenlerinizi claim etmek için geri dönün. Tokenler otomatik olarak bağlı cüzdanınıza gönderilecek.',

        // Binance Wallet
        'binance.title': 'Binance Web3 Wallet Kullanıcıları İçin',
        'binance.feature1': 'Kolay Kurulum',
        'binance.desc1': 'Binance App içinde yerleşik - ayrı kurulum gerekmez',
        'binance.feature2': 'Basit Köprüleme',
        'binance.desc2': 'Düşük ücretlerle zincirler arası varlık transferi',
        'binance.feature3': 'Gelişmiş Güvenlik',
        'binance.desc3': 'Binance altyapısı tarafından desteklenir',
        'binance.feature4': 'Tek Tıkla Bağlan',
        'binance.desc4': 'Ön satışımız gibi dApp\'lere sorunsuz bağlantı',

        // FAQ
        'faq.q1': 'Snake Token nedir?',
        'faq.a1': 'Snake Token, Binance Smart Chain üzerinde gerçek Play-to-Earn oyun entegrasyonu ile utility sağlayan topluluk odaklı bir meme tokenidir.',
        'faq.q2': 'Snake Token nasıl alınır?',
        'faq.a2': 'Ön satış sırasında: Cüzdanınızı bağlayıp USDT veya BNB kullanın. Lansman sonrası: PancakeSwap\'ta mevcut olacak.',
        'faq.q3': 'Oyun ne zaman çıkıyor?',
        'faq.a3': 'Hedef Lansman: 2026 2.–3. Çeyrek - Play-to-Earn Snake oyunumuz aktif geliştirme aşamasında.',
        'faq.q4': 'Toplam arz nedir?',
        'faq.a4': 'Toplam arz 400,000,000 SNAKE tokenıdır ve adil dağıtım yapılmıştır.',
        'faq.q5': 'SNAKE nerede listelenecek?',
        'faq.a5.1': 'İlk olarak BNB Chain üzerinde PancakeSwap\'ta listelenecek.',
        'faq.a5.2': 'MetaMask, Trust Wallet ve Binance Web3 gibi Web3 cüzdanlarınızı PancakeSwap\'a bağlayarak SNAKE alıp satabileceksiniz.',
        'faq.a5.3': 'İlerleyen aşamalarda oyun lansmanı sonrası büyük borsa listelemeleri hedefleniyor.',

        'faq.q6': 'Cüzdanımda SNAKE\'i nasıl görebilirim?',
        'faq.a6.1': 'SNAKE satın aldıktan veya claim ettikten sonra tokenlar BNB Chain üzerindeki cüzdan adresinize bağlı olur.',
        'faq.a6.2': 'Cüzdan uygulamanızda görünmesi için tokenı manuel olarak, özel token şeklinde eklemeniz gerekebilir.',
        'faq.a6.3': 'Binance Web3 Wallet: Binance uygulamasını açın → Cüzdan → Web3 Wallet → “+” (Token Ekle) butonuna dokunun, ağ olarak BNB Smart Chain’i seçin, SNAKE kontrat adresini 0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7 yapıştırıp onaylayın. Diğer cüzdanlar (MetaMask, Trust Wallet, SafePal): Aynı kontrat adresi, SNAKE sembolü ve 18 ondalık ile BNB Chain’de “Custom Token Ekle” bölümünü kullanın.',

        // Satış Tipleri
        'section.sales': 'Satış Tipleri',
        'section.sales.sub': 'Yatırım stratejinize en uygun ön satış modelini seçin.',
        'sales.normal.title': 'Normal Presale (Vesting Yok)',
        'sales.normal.tag': 'Daha esnek kısa/orta vade',
        'sales.normal.item1': 'Fiyat: 1 SNAKE = 0.02 USDT',
        'sales.normal.item2': 'Ödeme: BNB veya USDT (BEP-20)',
        'sales.normal.item3': 'Vesting: Yok',
        'sales.normal.item4': 'Dağıtım: TGE sonrasında tek işlemle %100 claim edilebilir.',
        'sales.vesting.title': 'Vestingli Presale (İndirimli Fiyat)',
        'sales.vesting.tag': 'Daha düşük fiyat, vesting takvimi',
        'sales.vesting.item1': 'Fiyat: 1 SNAKE = 0.015 USDT',
        'sales.vesting.item2': 'Ödeme: BNB veya USDT (BEP-20)',
        'sales.vesting.item3': 'Vesting: %30 TGE’de, kalan %70 7 ay boyunca her ay başında %10 açılır.',
        'sales.vesting.item4': 'Dağıtım: Yatırımcılar vesting süresince açılan kısmı presale panelinden claim eder.',

        // Legal - Terms of Service
        'legal.terms': 'Kullanım Şartları',
        'legal.terms.intro': 'Bu web sitesini kullanarak ve Snake Token ekosistemi ile etkileşime girerek aşağıdaki şartları kabul etmiş olursunuz:',
        'legal.terms.eligibility': 'Uygunluk',
        'legal.terms.eligibility.desc': 'Yargı yetkinizde yasal yaşta olmalı ve kripto para ile ilgili faaliyetlere katılmaya yasal olarak izin verilmelisiniz.',
        'legal.terms.info': 'Yalnızca Bilgi – Tavsiye Değil',
        'legal.terms.info.desc': 'Bu web sitesindeki tüm içerik yalnızca bilgilendirme ve eğitim amaçlıdır. Buradaki hiçbir şey finansal, yatırım, hukuki veya vergi tavsiyesi oluşturmaz. Herhangi bir karar vermeden önce mutlaka kendi araştırmanızı yapın.',
        'legal.terms.guarantees': 'Garanti veya Getiri Yok',
        'legal.terms.guarantees.desc': 'Snake Token deneysel bir topluluk projesidir. Token veya ilgili ürünlerin herhangi bir fiyat, kar, getiri veya gelecekteki değeri için garanti vermiyoruz.',
        'legal.terms.responsibility': 'Kullanıcı Sorumluluğu',
        'legal.terms.responsibility.desc': 'Cüzdanınızın, özel anahtarlarınızın ve işlemlerinizin güvenliğinden tamamen siz sorumlusunuz. Kayıp veya çalıntı fonları kurtaramayız ve blockchain üzerinde hiçbir kontrolümüz yoktur.',
        'legal.terms.prohibited': 'Yasaklı Kullanım',
        'legal.terms.prohibited.desc': 'Bu web sitesini veya Snake Token ekosistemini para aklama, dolandırıcılık veya yaptırım ihlalleri de dahil olmak üzere herhangi bir yasa dışı faaliyet için kullanmayacağınızı kabul edersiniz.',
        'legal.terms.changes': 'Web Sitesi ve Şartlardaki Değişiklikler',
        'legal.terms.changes.desc': 'Bu web sitesini ve bu Kullanım Şartlarını önceden haber vermeden istediğimiz zaman güncelleyebilir veya değiştirebiliriz. Değişikliklerden sonra siteyi kullanmaya devam etmeniz güncellenmiş şartları kabul ettiğiniz anlamına gelir.',

        // Legal - Other
        'legal.disclaimer': 'Önemli Risk Uyarısı',
        'legal.warning': 'Yatırım Uyarısı:',
        'legal.warning-desc': 'Snake Token deneysel bir topluluk projesidir. Kripto para yatırımları oldukça volatil ve risklidir. Yalnızca kaybetmeyi göze alabileceğiniz tutarları yatırın.',
        'legal.advice': 'Finansal Tavsiye Değildir:',
        'legal.advice-desc': 'Bu web sitesi finansal tavsiye oluşturmaz. Yatırım yapmadan önce mutlaka kendi araştırmanızı yapın (DYOR).',
        'legal.privacy': 'Gizlilik Politikası',
        'legal.updated': 'Son Güncelleme:',
        'legal.updated.date': 'Kasım 2025',
        'legal.privacy-desc': 'Kişisel bilgi toplamıyoruz. Web sitemiz statiktir ve takip çerezleri kullanmaz. Cüzdan bağlarken yalnızca public blockchain bilgilerine erişiriz.',

        // Footer
        'footer.desc': 'Binance Smart Chain üzerinde yenilikçi tokenomikler ve gerçek kullanım alanına sahip topluluk odaklı bir kripto para.',
        'footer.resources': 'Kaynaklar',
        'footer.legal': 'Yasal'
    }
};