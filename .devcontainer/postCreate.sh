alias ll='ls -l' && \
apt update && apt install -y nginx && pip3 install --user -r requirements.txt && \
export HOME=/workspaces/TFG-WIH && \
rm -rf /etc/nginx/conf.d/default.conf && \
rm -rf /etc/nginx/sites-enabled/default && \
ln -sf /workspaces/TFG-WIH/conf.d/app.conf /etc/nginx/conf.d/app.conf && \
useradd nginx && chown -R nginx:nginx /var/lib/nginx && chown -R nginx:nginx /var/log/nginx && chown -R nginx:nginx /etc/nginx && chown -R nginx:nginx /var/www/html && \
git config --global user.email "kenethlaunies.rodriguez@alu.uclm.es" && \
git config --global user.name "Keneth R" && \
service nginx start