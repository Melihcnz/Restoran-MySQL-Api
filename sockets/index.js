module.exports = (io) => {
  // Bağlantı olayını dinle
  io.on('connection', (socket) => {
    console.log('Kullanıcı bağlandı:', socket.id);

    // Masa durumu güncellemesi
    socket.on('masa_guncelle', (data) => {
      console.log('Masa güncellendi:', data);
      // Tüm bağlı istemcilere masa güncellemesini bildir
      io.emit('masa_guncellendi', data);
    });

    // Yeni sipariş oluşturulduğunda
    socket.on('yeni_siparis', (data) => {
      console.log('Yeni sipariş:', data);
      // Tüm bağlı istemcilere yeni sipariş bildir
      io.emit('siparis_alindi', data);
    });

    // Sipariş durumu güncellendiğinde
    socket.on('siparis_durumu_guncelle', (data) => {
      console.log('Sipariş durumu güncellendi:', data);
      // Tüm bağlı istemcilere sipariş durumu güncellemesini bildir
      io.emit('siparis_durumu_guncellendi', data);
    });

    // Yeni rezervasyon oluşturulduğunda
    socket.on('yeni_rezervasyon', (data) => {
      console.log('Yeni rezervasyon:', data);
      // Tüm bağlı istemcilere yeni rezervasyon bildir
      io.emit('rezervasyon_alindi', data);
    });

    // Mutfak siparişlerin hazır olduğunda
    socket.on('siparis_hazir', (data) => {
      console.log('Sipariş hazır:', data);
      // Tüm bağlı istemcilere sipariş hazır bildir
      io.emit('siparis_hazir_bildir', data);
    });

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      console.log('Kullanıcı ayrıldı:', socket.id);
    });
  });
}; 