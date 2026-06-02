import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { describe, it, expect } from 'vitest';

/**
 * Pact Consumer Test (Faz 9) — Frontend ↔ Backend sözleşmesi
 *
 * SORUN:
 * Frontend "API şu alanları döndürür" diye varsayar. Backend sessizce bir
 * alanın adını/tipini değiştirir → frontend production'da patlar. İkisi ayrı
 * test edildiği için kimse yakalayamaz.
 *
 * ÇÖZÜM (Consumer-Driven Contracts):
 * Bu test, frontend'in backend'den TAM OLARAK NE BEKLEDİĞİNİ yazılı hale
 * getirir. Çalıştırınca ./pacts/ altına bir "pact" (sözleşme) dosyası üretir.
 * Backend tarafı bu sözleşmeyi 'verify' ederek gerçekten bu cevabı verip
 * vermediğini kanıtlar (bkz. backend/contracts/verify_provider.py).
 *
 * NEDEN api.ts'i doğrudan çağırmıyoruz?
 * api.ts içindeki API_BASE, window.location'dan import anında hesaplanır ve
 * dışarıdan değiştirilemez. Bu yüzden burada fetchPatients ile AYNI istek
 * şeklini (GET, Bearer + X-Tenant header, /patients/ yolu) elle kurup mock
 * provider'a atıyoruz. Sözleşmenin doğruluğu için bu yeterli; ileride
 * API_BASE enjekte edilebilir hale getirilirse api.ts doğrudan çağrılabilir.
 *
 * ÇALIŞTIRMA:  npm run test:pact
 */

const { like, eachLike, integer, string } = MatchersV3;

const provider = new PactV3({
  consumer: 'yasca-frontend',
  provider: 'yasca-api',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Pact: GET /api/patients/', () => {
  it('kimliği doğrulanmış istek paginated hasta listesi döndürür', async () => {
    provider
      .given('standard tenant has at least one patient')
      .uponReceiving('a request for the patient list')
      .withRequest({
        method: 'GET',
        path: '/api/patients/',
        headers: {
          Authorization: like('Bearer eyJhbGciOi...'),
          'X-Tenant': 'standard',
        },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        // DRF PageNumberPagination zarfı + hasta nesnesinin frontend'in
        // gerçekten kullandığı alanları. Matcher'lar tipe bakar, sabit
        // değere değil → backend gerçek veride farklı isim verebilir.
        body: {
          count: integer(1),
          next: like(null),
          previous: like(null),
          results: eachLike({
            id: integer(1),
            first_name: string('Ahmet'),
            last_name: string('Yılmaz'),
            phone: string('+905551234567'),
            tckn: string('12345678901'),
          }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/api/patients/`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer eyJhbGciOi...',
          'X-Tenant': 'standard',
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      // fetchPatients() bu zarftan results'ı çıkarır — sözleşme bunu garanti eder
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results[0]).toHaveProperty('first_name');
      expect(data.results[0]).toHaveProperty('tckn');
    });
  });
});
