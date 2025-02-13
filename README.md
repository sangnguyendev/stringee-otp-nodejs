# Stringee OTP Call Sample
API Backend cuộc gọi xác thực mã OTP qua 2 luồng cuộc gọi Stringee

## Công nghệ sử dụng
- NodeJS
- MongoDB


## Cấu hình .env
Tạo file .env, copy nội dung file .env.example và thay đổi các thông số kết nối
### Stringee API Key
- Truy cập: https://developer.stringee.com để lấy STRINGEE_SID_KEY, STRINGEE_SECRET_KEY
- Thay đổi số tổng đài STRINGEE_NUMBER bằng số Stringee
### Các file âm thanh
Upload các file âm thanh và copy ID file, thay đổi các ID trong .env

## Cài đặt webhook
- Thay đổi Number Answer URL: https://your-server-url/webhook/number_anwser_url
- Thay đổi Number Event URL: https://your-server-url/webhook/number_event_url

## Cài đặt dependencies
```
npm install
```

## Chạy server môi trường local development
### Run queue
```
npm run dev
```

## Chạy server production/staging bằng pm2
```
pm2 start pm2.json
```

