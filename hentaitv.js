// @var HentaiTV
// Situs: WordPress. Tiap episode = 1 halaman /hentai/<slug>-episode-N/. Alur: search -> pilih episode -> player -> m3u8/mp4
var HentaiTV = (function () {
  var BASE = 'https://hentai.tv'; // <-- ganti di sini kalau domain pindah

  function search(q) {
    return request(BASE + '/?s=' + encodeURIComponent(q)).then(function (html) {
      return parseLinks(html, BASE, /\/hentai\/[^\/?#]+\/?$/i);
    });
  }

  function run(info, mediaType, season, episode) {
    var all = [];
    function searchKeep(q) { return search(q).then(function (c) { all = all.concat(c); return c; }); }

    return findMatch(searchKeep, info.titles).then(function (hit) {
      if (!hit) return [];
      var pick = hit;
      if (mediaType !== 'movie' && episode) {
        // dari semua hasil search, ambil yang judulnya mirip DAN nomor episodenya cocok
        var sameSeries = all.filter(function (c) { return bestMatch([c], info.titles, 0.6); });
        for (var i = 0; i < sameSeries.length; i++) {
          if (epNumber(sameSeries[i].url) === Number(episode) || epNumber(sameSeries[i].title) === Number(episode)) { pick = sameSeries[i]; break; }
        }
        if (epNumber(pick.url) !== Number(episode) && epNumber(pick.title) !== Number(episode)) {
          var guess = pick.url.replace(/(episode-)0*\d+/i, '$1' + episode);
          if (guess !== pick.url) pick = { url: guess, title: pick.title };
        }
      }
      return request(pick.url).then(function (html) {
        return resolveAll(collectFromPage(html, pick.url), pick.url);
      });
    });
  }

  return { id: 'hentaitv', name: 'Hentai.TV', referer: BASE + '/', run: run };
})();
