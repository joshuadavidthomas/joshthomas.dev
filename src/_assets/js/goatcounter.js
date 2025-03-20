var t = setInterval(() => {
  if (window.goatcounter && window.goatcounter.visit_count) {
    clearInterval(t);
    window.goatcounter.visit_count({
      append: "#pageStats",
    });
  }
}, 100);
