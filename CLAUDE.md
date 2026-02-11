# Правила проекта

## Архитектура: Feature-Sliced Design (FSD)

**КРИТИЧЕСКИ ВАЖНО**: Этот проект СТРОГО следует методологии Feature-Sliced Design (FSD).

### Структура проекта

```
src/
├── app/           # Инициализация приложения
│   ├── styles/    # Глобальные стили
│   ├── providers/ # Провайдеры (Router, Store, Theme и т.д.)
│   └── index.tsx  # Точка входа приложения
├── pages/         # Страницы приложения (роуты)
├── widgets/       # Крупные самостоятельные блоки UI
├── features/      # Функциональные блоки с бизнес-логикой
├── entities/      # Бизнес-сущности
└── shared/        # Переиспользуемый код без бизнес-логики
    ├── ui/        # UI-kit компоненты
    ├── lib/       # Утилиты и вспомогательные функции
    ├── api/       # Базовые настройки API
    └── config/    # Конфигурация и константы
```

### Слои FSD (по порядку зависимостей)

1. **app** - инициализация приложения, глобальные провайдеры, роутинг
2. **processes** (опционально) - сложные межстраничные сценарии
3. **pages** - страницы приложения
4. **widgets** - композиции из features и entities
5. **features** - части функциональности с бизнес-логикой
6. **entities** - бизнес-сущности проекта
7. **shared** - переиспользуемый код

### Правила слоев

#### 1. Правило изоляции слоев

- Модуль на одном слое **НЕ МОЖЕТ** импортировать другие модули с того же слоя
- Модуль может импортировать только модули из нижележащих слоев

**Примеры:**

```typescript
// ❌ НЕПРАВИЛЬНО - импорт с того же слоя
// features/auth/model.ts
import { profileApi } from 'features/profile/api';

// ✅ ПРАВИЛЬНО - импорт из нижележащих слоев
// features/auth/model.ts
import { userApi } from 'entities/user/api';
import { Button } from 'shared/ui/button';
```

#### 2. Структура слайса

Каждый слайс содержит сегменты (папки):

```
feature-name/
├── ui/           # React компоненты
├── model/        # Бизнес-логика (store, types, hooks)
├── api/          # API запросы
├── lib/          # Вспомогательные функции слайса
├── config/       # Конфигурация слайса
└── index.ts      # Public API слайса
```

**ВАЖНО:**

- Файл `index.ts` определяет публичный API слайса
- Импорты из слайса ТОЛЬКО через `index.ts`
- Внутренние модули слайса НЕ должны импортироваться напрямую

```typescript
// ❌ НЕПРАВИЛЬНО
import { LoginForm } from 'features/auth/ui/login-form';

// ✅ ПРАВИЛЬНО
import { LoginForm } from 'features/auth';
```

### Слой shared

- Содержит переиспользуемый код БЕЗ бизнес-логики
- НЕ может импортировать из других слоев (кроме самого shared)
- Примеры: UI-kit, утилиты, константы, базовые API настройки

### Слой entities

- Бизнес-сущности приложения (User, Product, Order и т.д.)
- Содержит: типы, CRUD операции, базовые компоненты для отображения
- НЕ содержит: сложную бизнес-логику (это для features)

### Слой features

- Действия пользователя, которые несут бизнес-ценность
- Примеры: auth (авторизация), add-to-cart (добавить в корзину)
- Может использовать entities и shared

### Слой widgets

- Большие композиции из features, entities, shared
- Примеры: Header, Sidebar, ProductCard
- Обычно привязаны к конкретным страницам

### Слой pages

- Страницы приложения (роуты)
- Композиция из widgets, features, entities
- Минимум собственной логики

### Слой app

- Инициализация приложения
- Глобальные провайдеры (Router, Theme, Store)
- Глобальные стили
- Точка входа

## Правила именования и кодирования

Все правила из глобального CLAUDE.md остаются в силе:

1. **kebab-case** для всех файлов и папок
2. **Стрелочные функции** везде
3. **Именованные экспорты** (без default)
4. **Запрет на `any`** - используй `unknown`, `never` или конкретные типы
5. **Запрет на `as`** (type assertions) - используй type guards и правильную типизацию
6. **Фигурные скобки** обязательны в условиях

## Дополнительные правила FSD

### 1. Именование слайсов в pages

**Правило**: Используй **краткие названия** для папок слайсов в слое `pages`.

```typescript
// ✅ ПРАВИЛЬНО
pages/main/
pages/profile/
pages/settings/

// ❌ НЕПРАВИЛЬНО
pages/main-page/
pages/profile-page/
pages/settings-page/
```

**Причина**: Уже понятно из контекста, что мы находимся в слое pages.

**НО**: Компоненты страниц именуй **полностью**:

```typescript
// pages/main/ui/index.tsx
export const MainPage = () => {}; // ✅ ПРАВИЛЬНО

export const Main = () => {}; // ❌ НЕПРАВИЛЬНО
```

### 2. Импорты без /index

**Правило**: НИКОГДА не пиши `/index` в конце пути импорта.

```typescript
// ✅ ПРАВИЛЬНО
export { MainPage } from './ui';
import { useAuth } from '@/features/auth';
import { UserCard } from '@/entities/user';

// ❌ НЕПРАВИЛЬНО
export { MainPage } from './ui/index';
import { useAuth } from '@/features/auth/index';
import { UserCard } from '@/entities/user/index';
```

**Причина**: Редактор (TypeScript/Node.js) автоматически подставляет `index` файл из каталога.

## Примеры правильной FSD структуры

### Пример 1: Feature "Авторизация"

```
features/
└── auth/
    ├── ui/
    │   ├── login-form/
    │   │   ├── index.tsx
    │   │   └── login-form.module.css
    │   └── index.ts
    ├── model/
    │   ├── types.ts
    │   ├── use-auth.ts
    │   └── index.ts
    ├── api/
    │   ├── auth-api.ts
    │   └── index.ts
    └── index.ts (экспортирует публичный API)
```

### Пример 2: Entity "User"

```
entities/
└── user/
    ├── ui/
    │   ├── user-avatar/
    │   │   ├── index.tsx
    │   │   └── user-avatar.module.css
    │   └── index.ts
    ├── model/
    │   ├── types.ts
    │   └── index.ts
    ├── api/
    │   ├── user-api.ts
    │   └── index.ts
    └── index.ts
```

### Пример 3: Страница (pages)

```
pages/
└── main/                    ← Краткое название слайса
    ├── index.ts             ← Public API
    │   export { MainPage } from './ui';  // БЕЗ /index!
    └── ui/
        └── index.tsx        ← Компонент
            export const MainPage = () => {};  // Полное название!
```

## Проверка соблюдения FSD

При добавлении нового кода ВСЕГДА проверяй:

1. ✅ Файл находится в правильном слое?
2. ✅ Нет импортов с того же слоя?
3. ✅ Нет импортов из вышележащих слоев?
4. ✅ Импорты идут через public API (index.ts)?
5. ✅ Структура слайса соответствует стандарту?

## Ресурсы

- [Официальная документация FSD](https://feature-sliced.design/)
- [FSD в React](https://feature-sliced.design/docs/guides/examples/react)

---

**ПОМНИ**: Нарушение FSD методологии в этом проекте недопустимо. Всегда следуй правилам слоев и изоляции.
