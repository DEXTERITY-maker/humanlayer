export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Политика конфиденциальности</h1>
      <p className="mt-2 text-sm text-muted">Последнее обновление: август 2026 г.</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <div>
          <h2 className="text-lg font-bold text-cream">1. Какие данные мы собираем</h2>
          <p className="mt-2">При регистрации: имя, email, город, телефон (опционально), Telegram (опционально), навыки и почасовая ставка. При создании заданий: заголовок, описание, категория, локация, бюджет. Файлы доказательств (фото/видео) хранятся на сервере.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cream">2. Как мы используем данные</h2>
          <p className="mt-2">Данные используются исключительно для работы платформы: подбор исполнителей, проведение сделок, расчёт рейтинга. Email используется для входа и уведомлений о заданиях. Мы не передаём данные третьим лицам.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cream">3. Хранение данных</h2>
          <p className="mt-2">Данные хранятся в базе данных Neon (PostgreSQL) в регионе ЕС. Пароли хешируются алгоритмом scrypt и никогда не хранятся в открытом виде.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cream">4. Файлы cookie</h2>
          <p className="mt-2">Мы используем единственную httpOnly-куку для хранения сессии (JWT-токен). Никаких трекинговых или рекламных cookie.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cream">5. Удаление аккаунта</h2>
          <p className="mt-2">Вы можете удалить аккаунт через страницу настроек. Все ваши данные будут безвозвратно удалены в течение 30 дней.</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-cream">6. Контакты</h2>
          <p className="mt-2">По вопросам конфиденциальности: privacy@humanlayer.app</p>
        </div>
      </section>
    </div>
  );
}
