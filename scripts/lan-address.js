const os = require('os');

function getLanIpv4Addresses() {
  const addrs = [];
  const nets = os.networkInterfaces();

  Object.values(nets).forEach((entries) => {
    (entries || []).forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) {
        addrs.push(net.address);
      }
    });
  });

  return [...new Set(addrs)];
}

module.exports = { getLanIpv4Addresses };
