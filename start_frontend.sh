#!/bin/bash
cd frontend
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.com pnpm run dev --host 0.0.0.0 --port 3000 > ../frontend.log 2>&1 &
echo $! > ../frontend.pid
