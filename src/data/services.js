const fs = require("fs");
const path = require("path");

const servicesDir = path.join(__dirname, "services");
const defaultServiceOrder = [
  "kvartirnyj-pereezd-voronezh",
  "ofisnyj-pereezd-voronezh",
  "gazel-s-gruzchikami-voronezh",
  "vyvoz-musora-voronezh"
];

const serviceMetaBySlug = {
  "kvartirnyj-pereezd-voronezh": {
    name: "Квартирный переезд",
    homeText: "Переезд квартиры под ключ с разборкой мебели, перевозкой и заносом.",
    relatedText: "Полный переезд квартиры: от подготовки мебели до расстановки на новом адресе."
  },
  "ofisnyj-pereezd-voronezh": {
    name: "Офисный переезд",
    homeText: "Перевозка офиса по отделам без простоя команды и с четким таймингом.",
    relatedText: "Организованный переезд офиса с учетом графика работы и пропускного режима."
  },
  "gazel-s-gruzchikami-voronezh": {
    name: "Газель с грузчиками",
    homeText: "Машина и бригада в одном заказе для разовых перевозок и срочных задач.",
    relatedText: "Подходит для точечных перевозок, когда нужна машина и грузчики на несколько часов."
  },
  "vyvoz-musora-voronezh": {
    name: "Вывоз мусора",
    homeText: "Вынос, погрузка и вывоз строительного мусора, упаковки и старой мебели.",
    relatedText: "Удобно добавить после переезда или ремонта, чтобы быстро освободить помещение."
  }
};

const contextualLinkTemplates = {
  "kvartirnyj-pereezd-voronezh": [
    {
      targetSlug: "gazel-s-gruzchikami-voronezh",
      before: "Если перевозите только часть вещей или нужен быстрый выезд без полного переезда, удобнее заказать ",
      anchor: "газель с грузчиками",
      after: " и подобрать машину под конкретный объем."
    },
    {
      targetSlug: "vyvoz-musora-voronezh",
      before: "После разгрузки часто остается упаковка и старая мебель: в этом случае можно сразу добавить ",
      anchor: "вывоз мусора",
      after: ", чтобы освободить квартиру в тот же день."
    }
  ],
  "ofisnyj-pereezd-voronezh": [
    {
      targetSlug: "gazel-s-gruzchikami-voronezh",
      before: "Для точечных задач между кабинетами и филиалами обычно хватает формата ",
      anchor: "газель с грузчиками",
      after: ", когда нужен транспорт и бригада на несколько часов."
    },
    {
      targetSlug: "vyvoz-musora-voronezh",
      before: "Если после переезда остается старая мебель и упаковка, удобно заранее запланировать ",
      anchor: "вывоз мусора",
      after: ", чтобы команда не тратила рабочее время на уборку."
    }
  ],
  "gazel-s-gruzchikami-voronezh": [
    {
      targetSlug: "kvartirnyj-pereezd-voronezh",
      before: "Когда перевозка превращается в полноценный домашний проект, выгоднее сразу оформить ",
      anchor: "квартирный переезд под ключ",
      after: ", чтобы одна команда закрыла все этапы без повторных выездов."
    },
    {
      targetSlug: "ofisnyj-pereezd-voronezh",
      before: "Для бизнес-задач с техникой и документами лучше подходит ",
      anchor: "офисный переезд",
      after: ", где мы заранее планируем очередность отделов и работу в окнах без простоя."
    }
  ],
  "vyvoz-musora-voronezh": [
    {
      targetSlug: "gazel-s-gruzchikami-voronezh",
      before: "Если нужно не только освободить помещение, но и перевезти вещи на новый адрес, удобно совместить выезд с услугой ",
      anchor: "газель с грузчиками",
      after: ", чтобы закрыть задачу одной командой."
    },
    {
      targetSlug: "kvartirnyj-pereezd-voronezh",
      before: "При полном переезде квартиры можно заранее запланировать ",
      anchor: "квартирный переезд",
      after: " и добавить вывоз лишних вещей в тот же день без повторного заказа."
    }
  ]
};

const serviceOrderMap = new Map(defaultServiceOrder.map((slug, index) => [slug, index]));

function toServicePath(slug) {
  return `/${slug}/`;
}

function readService(fileName) {
  const filePath = path.join(servicesDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  return JSON.parse(source);
}

function toSentence(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return "";
  }

  const firstSentence = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return firstSentence ? firstSentence[1].trim() : trimmed;
}

function getDefaultName(service) {
  return (service.h1 || service.landing?.hero?.title || service.title || service.slug)
    .replace(/\s+в\s+Воронеже$/i, "")
    .trim();
}

function getDefaultHomeText(service) {
  return toSentence(service.landing?.hero?.subtitle || service.description || "");
}

function getDefaultRelatedText(service) {
  return toSentence(service.description || service.landing?.hero?.subtitle || "");
}

const items = fs
  .readdirSync(servicesDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .map(readService)
  .sort((left, right) => {
    const leftOrder = serviceOrderMap.has(left.slug) ? serviceOrderMap.get(left.slug) : Number.MAX_SAFE_INTEGER;
    const rightOrder = serviceOrderMap.has(right.slug) ? serviceOrderMap.get(right.slug) : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.slug.localeCompare(right.slug, "ru");
  });

const serviceCards = items.map((service) => {
  const meta = serviceMetaBySlug[service.slug] || {};

  return {
    slug: service.slug,
    path: toServicePath(service.slug),
    name: meta.name || getDefaultName(service),
    homeText: meta.homeText || getDefaultHomeText(service),
    relatedText: meta.relatedText || getDefaultRelatedText(service)
  };
});

const serviceCardBySlug = Object.fromEntries(serviceCards.map((serviceCard) => [serviceCard.slug, serviceCard]));

for (const service of items) {
  const selfCard = serviceCardBySlug[service.slug];

  service.path = selfCard ? selfCard.path : toServicePath(service.slug);
  service.shortName = selfCard ? selfCard.name : getDefaultName(service);
  service.otherServices = serviceCards.filter((serviceCard) => serviceCard.slug !== service.slug);

  const templates = contextualLinkTemplates[service.slug] || [];
  service.contextualLinks = templates
    .map((item) => {
      const target = serviceCardBySlug[item.targetSlug];
      if (!target) {
        return null;
      }

      return {
        before: item.before,
        anchor: item.anchor || target.name,
        after: item.after,
        path: target.path
      };
    })
    .filter(Boolean);
}

module.exports = { items, serviceCards };
