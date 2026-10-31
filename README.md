# Quiz About Everything

Kodlama, matematik, Türkçe ve genel kültür quizleri. Expo (React Native) ile yazıldı:
aynı kod web'de, Android'de ve iOS'ta çalışır.

## Çalıştırma

Gerekenler: [Node.js](https://nodejs.org) (LTS sürümü).

```bash
npm install        # ilk seferde bağımlılıkları kurar
npm run web        # tarayıcıda açar (http://localhost:8081)
npm start          # telefonda denemek için QR kod verir (Expo Go uygulamasıyla okut)
```

Diğer komutlar:

```bash
npm run typecheck          # TypeScript hatalarını kontrol eder
npx expo export -p web     # web sitesini dist/ klasörüne derler (yayına hazır)
```

## Klasör yapısı

```
src/
  app/                    ekranlar (her dosya bir sayfa — Expo Router)
    _layout.tsx           üst bar, yazı tipleri, oturum sağlayıcısı
    login.tsx             giriş yap / hesap oluştur
    index.tsx             ana sayfa: kategoriler
    quiz/[categoryId].tsx quiz akışı ve sonuç ekranı
    leaderboard.tsx       liderlik tablosu
    profile.tsx           profil ve geçmiş sonuçlar
  components/ui.tsx       ortak bileşenler (Button, TextField, Screen, AppText)
  context/AuthContext.tsx giriş yapan kullanıcı
  data/
    categories.ts         kategori listesi ve quiz ayarları
    questions/*.json      soru bankası
  services/backend.ts     veri katmanı (şimdilik cihazda)
  theme.ts                renkler, yazı tipi, boşluklar
```

## Yeni soru veya kategori eklemek

Soru eklemek için ilgili JSON dosyasına aynı yapıda bir kayıt ekle:

```json
{
  "id": "mat-13",
  "question": "9 × 6 kaçtır?",
  "options": ["54", "56", "45", "63"],
  "answer": 0,
  "explanation": "9 × 6 = 54."
}
```

`answer`, doğru şıkkın `options` içindeki sırasıdır (0'dan başlar). Şıklar oyun sırasında
karıştırıldığı için doğru cevabı hep aynı yere koyman sorun olmaz.

Yeni kategori (ör. İngilizce) eklemek için `src/data/questions/ingilizce.json` dosyasını
oluştur ve `src/data/categories.ts` içinde listeye ekle.

## Puanlama

- Her quiz kategoriden rastgele 10 soru seçer, soru başına 20 saniye süre var.
- Doğru cevap 100 puan, kalan her saniye için +5 bonus (soru başına en fazla 200).
- Liderlik tablosu: kategori seçiliyse o kategorideki en iyi puan, "Tümü"nde her
  kategorideki en iyi puanların toplamı.

## Veriler nerede tutuluyor?

Şimdilik hesaplar, sonuçlar ve liderlik tablosu **cihazda** tutuluyor (web'de tarayıcının
localStorage'ı, telefonda AsyncStorage). Yani liderlik tablosu yalnızca o cihazdaki
oyuncuları gösterir. Şifreler düz metin olarak değil, tuzlanmış SHA-256 özetiyle saklanır,
ama bu gerçek bir sunucu güvenliği değildir.

Herkesin ortak liderlik tablosunu görmesi için sonraki adım bir sunucuya geçmek
(ör. Supabase). Uygulamanın geri kalanı yalnızca `src/services/backend.ts` içindeki
`Backend` arayüzünü kullanıyor; aynı arayüzü uygulayan bir `SupabaseBackend` yazıp dosyanın
sonundaki satırı değiştirmek yeterli olacak.
