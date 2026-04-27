import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { del, get, put } from '@vercel/blob';
import { seedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.json');
const uploadsDir = path.join(rootDir, 'uploads');
const allowedUploadModules = new Set(['dishes', 'orders', 'home']);
const isVercelRuntime = process.env.VERCEL === '1';
const useBlobStorage =
  process.env.STORAGE_DRIVER === 'blob' ||
  (isVercelRuntime && Boolean(process.env.BLOB_READ_WRITE_TOKEN));
const blobDbPath = 'little-hearth/data/db.json';
const blobUploadPrefix = 'little-hearth/uploads';
let memoryDb;

const app = express();
const port = Number(process.env.API_PORT || 5174);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

function cloneSeedData() {
  return JSON.parse(JSON.stringify(seedData));
}

async function ensureRuntimeFiles() {
  if (isVercelRuntime || useBlobStorage) {
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.join(uploadsDir, 'dishes'), { recursive: true });
  await fs.mkdir(path.join(uploadsDir, 'orders'), { recursive: true });
  await fs.mkdir(path.join(uploadsDir, 'home'), { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    await writeDb(seedData);
  }
}

async function readDb() {
  if (useBlobStorage) {
    const blob = await get(blobDbPath, { access: 'private', useCache: false }).catch(() => null);

    if (!blob?.stream) {
      const initialData = cloneSeedData();
      await writeDb(initialData);
      return initialData;
    }

    const content = await new Response(blob.stream).text();
    const data = JSON.parse(content);
    return await normalizeDb(data);
  }

  if (isVercelRuntime) {
    if (!memoryDb) {
      memoryDb = cloneSeedData();
    }

    memoryDb = await normalizeDb(memoryDb);
    return memoryDb;
  }

  await ensureRuntimeFiles();
  const content = await fs.readFile(dbPath, 'utf8');
  const data = JSON.parse(content);
  return await normalizeDb(data);
}

async function normalizeDb(data) {
  let changed = false;

  if (!data.homeSettings) {
    data.homeSettings = seedData.homeSettings;
    changed = true;
  }

  if (!Array.isArray(data.dishes)) {
    data.dishes = [];
    changed = true;
  }

  if (!Array.isArray(data.orders)) {
    data.orders = [];
    changed = true;
  }

  if (!Array.isArray(data.todayMenuIds)) {
    data.todayMenuIds = [];
    changed = true;
  }

  if (changed) {
    await writeDb(data);
  }

  return data;
}

async function writeDb(data) {
  if (useBlobStorage) {
    await put(blobDbPath, JSON.stringify(data, null, 2), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return;
  }

  if (isVercelRuntime) {
    memoryDb = data;
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getLocalUploadPath(url, moduleName) {
  const uploadPrefix = `/uploads/${moduleName}/`;
  if (typeof url !== 'string' || !url.startsWith(uploadPrefix)) {
    return null;
  }

  return path.join(uploadsDir, moduleName, path.basename(url));
}

async function deleteStoredOrderImage(url) {
  const localPath = getLocalUploadPath(url, 'orders');

  if (localPath) {
    await fs.unlink(localPath).catch(() => undefined);
    return;
  }

  if (useBlobStorage && typeof url === 'string' && url.includes('.blob.vercel-storage.com/')) {
    await del(url).catch(() => undefined);
  }
}

function assertValidUploadModule(moduleName) {
  if (!allowedUploadModules.has(moduleName)) {
    const error = new Error('Unsupported upload module');
    error.status = 400;
    throw error;
  }
}

function createUploadFilename(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

const storage = isVercelRuntime || useBlobStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, _file, cb) => {
        try {
          const moduleName = req.params.module;
          assertValidUploadModule(moduleName);
          cb(null, path.join(uploadsDir, moduleName));
        } catch (error) {
          cb(error);
        }
      },
      filename: (_req, file, cb) => {
        cb(null, createUploadFilename(file));
      },
    });

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }

    cb(null, true);
  },
});

const dishSearchDictionary = [
  ['红烧肉', 'braised pork belly chinese dish'],
  ['回锅肉', 'twice cooked pork chinese dish'],
  ['糖醋排骨', 'sweet and sour pork ribs'],
  ['排骨', 'pork ribs food'],
  ['鱼香肉丝', 'yuxiang shredded pork chinese dish'],
  ['宫保鸡丁', 'kung pao chicken'],
  ['辣子鸡', 'chongqing spicy chicken'],
  ['鸡丁', 'diced chicken food'],
  ['鸡翅', 'chicken wings food'],
  ['鸡', 'chicken dish'],
  ['牛肉', 'beef dish'],
  ['羊肉', 'lamb dish'],
  ['清蒸鱼', 'steamed fish chinese dish'],
  ['鲈鱼', 'steamed sea bass food'],
  ['鱼', 'fish dish'],
  ['虾', 'shrimp dish'],
  ['番茄炒蛋', 'tomato scrambled eggs chinese dish'],
  ['西红柿炒蛋', 'tomato scrambled eggs chinese dish'],
  ['鸡蛋', 'egg dish'],
  ['豆腐', 'tofu dish'],
  ['麻婆豆腐', 'mapo tofu'],
  ['青菜', 'chinese greens vegetable dish'],
  ['白菜', 'chinese cabbage dish'],
  ['土豆', 'potato dish'],
  ['茄子', 'eggplant dish'],
  ['饺子', 'dumplings chinese food'],
  ['包子', 'baozi steamed buns'],
  ['馒头', 'steamed buns'],
  ['面', 'noodles food'],
  ['饭', 'rice dish'],
  ['粥', 'congee rice porridge'],
  ['汤', 'soup food'],
  ['炒', 'stir fry chinese food'],
  ['蒸', 'steamed chinese food'],
  ['红烧', 'braised chinese dish'],
];

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

function normalizeDishSearchQuery(query) {
  const matchedTerms = dishSearchDictionary
    .filter(([keyword]) => query.includes(keyword))
    .map(([, term]) => term);

  if (matchedTerms.length > 0) {
    return [...new Set(matchedTerms)].slice(0, 4).join(' ');
  }

  if (/[\u4e00-\u9fa5]/.test(query)) {
    return `chinese home cooking ${hashString(query) % 997}`;
  }

  return query;
}

async function searchCommonsImage(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  const searchTerms = `${normalizeDishSearchQuery(query)} food dish cuisine`;
  const searchParams = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '10',
    gsrsearch: searchTerms,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`, {
    headers: {
      'User-Agent': 'LittleHearth/1.0 local dish image search',
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error('Image search service unavailable');
  }

  const result = await response.json();
  const pages = Object.values(result.query?.pages || {});
  const image = pages.find((page) => {
    const info = page.imageinfo?.[0];
    return info?.thumburl && info.mime?.startsWith('image/');
  });

  const info = image?.imageinfo?.[0];
  if (!info?.thumburl) {
    return null;
  }

  return {
    title: image.title,
    url: info.thumburl,
    sourceUrl: info.descriptionurl || info.url,
  };
}

function createFallbackDishImage(query) {
  const normalizedQuery = normalizeDishSearchQuery(query);
  const encodedQuery = encodeURIComponent(normalizedQuery.replace(/\s+/g, ','));
  const lock = hashString(query);
  return {
    title: query,
    url: `https://loremflickr.com/800/800/${encodedQuery},food,dish?lock=${lock}`,
    sourceUrl: 'https://loremflickr.com/',
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/dish-image-search', async (req, res, next) => {
  try {
    const name = String(req.query.name || '').trim();

    if (!name) {
      res.status(400).json({ message: 'Dish name is required' });
      return;
    }

    const image = await searchCommonsImage(name).catch(() => null);

    res.json(image || createFallbackDishImage(name));
  } catch (error) {
    next(error);
  }
});

app.get('/api/data', async (_req, res, next) => {
  try {
    res.json(await readDb());
  } catch (error) {
    next(error);
  }
});

app.put('/api/home-settings', async (req, res, next) => {
  try {
    const data = await readDb();
    const current = data.homeSettings || seedData.homeSettings;
    const homeSettings = {
      greeting: String(req.body.greeting || current.greeting || '').trim(),
      titlePrefix: String(req.body.titlePrefix || current.titlePrefix || '').trim(),
      titleHighlight: String(req.body.titleHighlight || current.titleHighlight || '').trim(),
      titleSuffix: String(req.body.titleSuffix || current.titleSuffix || '').trim(),
      heroImage: String(req.body.heroImage || current.heroImage || '').trim(),
    };

    data.homeSettings = homeSettings;
    await writeDb(data);
    res.json(homeSettings);
  } catch (error) {
    next(error);
  }
});

app.post('/api/uploads/:module', upload.array('images', 8), async (req, res, next) => {
  try {
    const moduleName = req.params.module;
    assertValidUploadModule(moduleName);

    if (isVercelRuntime && !useBlobStorage) {
      res.status(500).json({
        message: 'Image uploads on Vercel require a linked Vercel Blob store.',
      });
      return;
    }

    const files = useBlobStorage
      ? await Promise.all(
          (req.files || []).map(async (file) => {
            const filename = createUploadFilename(file);
            const blob = await put(`${blobUploadPrefix}/${moduleName}/${filename}`, file.buffer, {
              access: 'public',
              addRandomSuffix: true,
              contentType: file.mimetype,
            });

            return {
              filename: path.basename(blob.pathname),
              module: moduleName,
              url: blob.url,
            };
          })
        )
      : (req.files || []).map((file) => ({
          filename: file.filename,
          module: moduleName,
          url: `/uploads/${moduleName}/${file.filename}`,
        }));

    res.status(201).json({ files });
  } catch (error) {
    next(error);
  }
});

app.post('/api/dishes', async (req, res, next) => {
  try {
    const data = await readDb();
    const dish = {
      id: req.body.id || createId('dish'),
      name: String(req.body.name || '').trim(),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      img: req.body.img || '',
      ready: Boolean(req.body.ready),
      desc: req.body.desc || '',
    };

    if (!dish.name) {
      res.status(400).json({ message: 'Dish name is required' });
      return;
    }

    data.dishes.push(dish);
    await writeDb(data);
    res.status(201).json(dish);
  } catch (error) {
    next(error);
  }
});

app.put('/api/dishes/:id', async (req, res, next) => {
  try {
    const data = await readDb();
    const index = data.dishes.findIndex((dish) => dish.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ message: 'Dish not found' });
      return;
    }

    const updatedDish = {
      ...data.dishes[index],
      ...req.body,
      id: req.params.id,
      name: String(req.body.name || data.dishes[index].name || '').trim(),
      tags: Array.isArray(req.body.tags) ? req.body.tags : data.dishes[index].tags,
      ready: Boolean(req.body.ready),
    };

    if (!updatedDish.name) {
      res.status(400).json({ message: 'Dish name is required' });
      return;
    }

    data.dishes[index] = updatedDish;
    await writeDb(data);
    res.json(updatedDish);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/dishes/:id', async (req, res, next) => {
  try {
    const data = await readDb();
    data.dishes = data.dishes.filter((dish) => dish.id !== req.params.id);
    data.todayMenuIds = data.todayMenuIds.filter((id) => id !== req.params.id);
    await writeDb(data);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put('/api/menu', async (req, res, next) => {
  try {
    const data = await readDb();
    const ids = Array.isArray(req.body.todayMenuIds) ? req.body.todayMenuIds : [];
    const validIds = ids.filter((id) => data.dishes.some((dish) => dish.id === id));
    data.todayMenuIds = validIds;
    await writeDb(data);
    res.json({ todayMenuIds: validIds });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const data = await readDb();
    const order = {
      id: req.body.id || createId('order'),
      dateKey: req.body.dateKey || '',
      date: req.body.date,
      items: req.body.items,
      note: req.body.note || '',
      status: req.body.status || '已完成',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      extra: Number(req.body.extra || 0),
      dishIds: Array.isArray(req.body.dishIds) ? req.body.dishIds : [],
    };

    data.orders = [order, ...data.orders];
    await writeDb(data);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/orders/:id', async (req, res, next) => {
  try {
    const data = await readDb();
    const order = data.orders.find((item) => item.id === req.params.id);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    data.orders = data.orders.filter((item) => item.id !== req.params.id);
    await writeDb(data);

    await Promise.all((order.images || []).map((url) => deleteStoredOrderImage(url)));

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Server error',
  });
});

if (!isVercelRuntime) {
  await ensureRuntimeFiles();

  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

export default app;
