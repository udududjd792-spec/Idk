// @var HentaiMama
// Situs: DooPlay (WordPress). Alur: search -> halaman series -> halaman episode -> player (ajax/iframe) -> m3u8/mp4
var HentaiMama = (function () {
  var BASE = 'https://hentaimama.io'; // <-- ganti di sini kalau domain pindah

  function search(q) {
    return request(BASE + '/?s=' + encodeURIComponent(q)).then(function (html) {
      return parseLinks(html, BASE, /\/(?:tvshows|movies|episodes)\/[^\/?#]+/i);
    });
  }

  // Ambil link embed dari tombol player DooPlay
  function dooPlayers(html, pageUrl) {
    var opts = [], re = /<li\b[^>]*dooplay_player_option[^>]*>/gi, m;
    while ((m = re.exec(html))) {
      opts.push({ post: attr(m[0], 'data-post'), nume: attr(m[0], 'data-nume') || '1', type: attr(m[0], 'data-type') || 'tv' });
    }
    return Promise.all(opts.map(function (o) {
      var rest = BASE + '/wp-json/dooplayer/v2/' + o.post + '/' + o.type + '/' + o.nume;
      return request(rest, { headers: { Referer: pageUrl } })
        .then(extractLinks)
        .then(function (l) { return l.length ? l : Promise.reject(new Error('empty')); })
        .catch(function () {
          return request(BASE + '/wp-admin/admin-ajax.php', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Referer: pageUrl, Origin: BASE },
            body: 'action=doo_player_ajax&post=' + o.post + '&nume=' + o.nume + '&type=' + o.type
          }).then(extractLinks);
        })
        .catch(function () { return []; });
    })).then(flatten);
  }

  function pickEpisode(page, pageUrl, mediaType, episode) {
    if (/\/episodes\//i.test(pageUrl)) {
      // hasil search langsung berupa halaman episode: sesuaikan nomor episode lewat URL
      if (mediaType === 'movie' || !episode || epNumber(pageUrl) === Number(episode)) return pageUrl;
      return pageUrl.replace(/(episode-)0*\d+/i, '$1' + episode);
    }
    var eps = parseLinks(page, BASE, /\/episodes\/[^\/?#]+/i);
    if (!eps.length) return null;
    if (mediaType === 'movie' || !episode) return eps[eps.length - 1].url;
    for (var i = 0; i < eps.length; i++) if (epNumber(eps[i].url) === Number(episode)) return eps[i].url;
    return eps.length === 1 ? eps[0].url : null;
  }

  function run(info, mediaType, season, episode) {
    return findMatch(search, info.titles).then(function (hit) {
      if (!hit) return [];
      return request(hit.url).then(function (page) {
        var epUrl = pickEpisode(page, hit.url, mediaType, episode);
        if (!epUrl) return [];
        var load = epUrl === hit.url ? Promise.resolve(page) : request(epUrl);
        return load.then(function (html) {
          return dooPlayers(html, epUrl).then(function (links) {
            return resolveAll(links.concat(collectFromPage(html, epUrl)), epUrl);
          });
        });
      });
    });
  }

  return { id: 'hentaimama', name: 'HentaiMama', referer: BASE + '/', run: run };
})();
