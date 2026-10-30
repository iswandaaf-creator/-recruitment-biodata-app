const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /opt/mailcow-dockerized
    MYSQL_PASS=$(grep -E '^DBPASS=' mailcow.conf | cut -d= -f2)
    MYSQL_USER=$(grep -E '^DBUSER=' mailcow.conf | cut -d= -f2)
    MYSQL_DB=$(grep -E '^DBNAME=' mailcow.conf | cut -d= -f2)
    MYSQL_ID=$(docker compose ps -q mysql-mailcow)

    docker exec "$MYSQL_ID" mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "UPDATE domain SET mailboxes=200, quota=102400, maxquota=102400 WHERE domain='kovgroups.com';"
    docker exec "$MYSQL_ID" mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" -e "SELECT domain, aliases, mailboxes, defquota, maxquota, quota FROM domain WHERE domain='kovgroups.com';"
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({ host: '103.119.237.21', port: 20103, username: 'root', password: 'Kovgroup26' });
