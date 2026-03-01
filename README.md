# Truy Thu Dien - WebApp

Web app giao dien va chuc nang dong bo voi mobile app: tinh truy thu dien, tra cuu phap ly AI, lich su tinh toan va quan tri he thong.

## Chay local

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env` tu `.env.example`:

```bash
cp .env.example .env
```

3. Chay dev:

```bash
npm run dev
```

## Bien moi truong

- `VITE_API_BASE_URL`: dia chi backend API (mac dinh fallback la `https://electronic-b.vercel.app/api`).

## Build production

```bash
npm run build
```

## Deploy Vercel

- Du an da co `vercel.json` de rewrite SPA route ve `index.html`.
- Truyen env `VITE_API_BASE_URL` tren Vercel Project Settings.
- Deploy bang Vercel dashboard hoac CLI:

```bash
vercel --prod
```

## Login nhanh

- Man hinh login co nut `Dang nhap nhanh` de vao dung ngay khong can tai khoan.
- Cac tinh nang can token (luu lich su server, admin) se tu dong an trong guest mode.
