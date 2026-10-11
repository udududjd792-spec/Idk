// @var Hanime
// Situs: hanime.tv (JSON API). EKSPERIMENTAL: endpoint & proteksi sering berubah (Cloudflare / signature).
var Hanime = (function () {
  var SEARCH_URL = 'https://search.htv-services.com/search'; // <-- ganti kalau endpoint pindah
  var VIDEO_API = 'https://hanime.tv/api/v8/video?id='; // <-- ganti kalau endpoint pindah
  var SITE = 'https://hanime.tv/';
  var H = { Referer: SITE, Origin: 'https://hanime.tv', Accept: 'application/json' };

  function search(q) {
    var body = JSON.stringify({
      search_text: q, tags: [], tags_mode: 'AND', brands: [], blacklist: [],
      order_by: 'created_at_unix', ordering: 'desc', page: 0
    });
    return requestJson(SEARCH_URL, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: body })
      .then(function (d) {
        var hits = typeof d.hits === 'string' ? JSON.parse(d.hits) : (d.hits || []);
        return hits.map(function (h) { return { title: h.name, url: h.slug }; });
      });
  }
  function video(slug) { return requestJson(VIDEO_API + encodeURIComponent(slug), { headers: H }); }

  function streamsOf(d) {
    var servers = (d.videos_manifest && d.videos_manifest.servers) || [], out = [];
    servers.forEach(function (s) {
      (s.streams || []).forEach(function (st) {
        if (st.url) out.push({ url: st.url, referer: SITE, label: s.name || '', quality: st.height ? st.height + 'p' : undefined, h: st.height || 0 });
      });
    });
    out.sort(function (a, b) { return b.h - a.h; });
    return out;
  }

  function run(info, mediaType, season, episode) {
    return findMatch(search, info.titles).then(function (hit) {
      if (!hit) return [];
      return video(hit.url).then(function (d) {
        var fr = d.hentai_franchise_hentai_videos || [], slug = hit.url;
        if (mediaType !== 'movie' && episode && fr.length > 1) {
          var n = Number(episode), found = null, i;
          for (i = 0; i < fr.length; i++) if (epNumber(fr[i].slug) === n) { found = fr[i]; break; }
          if (!found && fr[n - 1]) found = fr[n - 1];
          if (found && found.slug !== slug) slug = found.slug;
        }
        return slug === hit.url ? streamsOf(d) : video(slug).then(streamsOf);
      });
    });
  }

  return { id: 'hanime', name: 'Hanime', referer: SITE, run: run };
})();
