alias ll='ls -l' && \
apt update && apt install -y nginx && pip3 install --user -r requirements.txt && \
export HOME=/workspaces/TFG-WIH && \
useradd nginx && chown -R nginx:nginx /var/lib/nginx && chown -R nginx:nginx /var/log/nginx && chown -R nginx:nginx /etc/nginx && chown -R nginx:nginx /var/www/html && \
ln -sf /etc/nginx/nginx.conf /workspaces/TFG-WIH/nginx_files/nginx.conf && \
service nginx start