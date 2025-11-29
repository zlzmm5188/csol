# 使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制前台文件到 Nginx 目录
COPY . /usr/share/nginx/html/

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
