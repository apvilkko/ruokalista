import React, { useEffect, useState } from "react";
import uuidv4 from "uuid/v4";
import seedrandom from "seedrandom";
import { createBrowserHistory } from "history";
import { sample } from "./rand";

const history = createBrowserHistory();

const trimList = x =>
  (x.trim() || "")
    .split(",")
    .map(x => x.trim())
    .filter(x => !!x);

const processData = data => {
  const lines = data.split("\n");
  const ret = {};
  for (let i = 1; i < lines.length; ++i) {
    const items = lines[i].split("\t");
    if (items.length < 2) {
      continue;
    }
    ret[items[0].trim()] = {
      name: items[1].trim(),
      tags: trimList(items[2]),
      diet: trimList(items[3]),
      ingredients: trimList(items[4])
    };
  }
  return ret;
};

const createSeed = () => uuidv4().substr(0, 8);

const setSearch = params => {
  history.replace({ search: `?${params.toString()}` });
};

const setParam = (key, value) => {
  const newParams = new URLSearchParams(history.location.search);
  newParams.set(
    key,
    typeof value === "boolean" ? Math.abs(String(value).indexOf("f")) : value
  );
  setSearch(newParams);
};

export default () => {
  const [db, setDb] = useState(null);
  const [seed, setSeed] = useState(null);
  const [ready, setReady] = useState(false);
  const [reqAmount, setReqAmount] = useState(0);
  const [kidsOnly, setKidsOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [choices, setChoices] = useState([]);
  const [shopList, setShopList] = useState([]);
  const [ids, setIds] = useState([]);
  const [bought, setBought] = useState({});

  // Handle query params
  useEffect(() => {
    const params = new URLSearchParams(history.location.search);
    setReqAmount(Number(params.get("a") || 0));
    setKidsOnly(params.get("k") === "1");
    setVegOnly(params.get("v") === "1");
    setSeed(params.get("s") || createSeed());
    setReady(true);
  }, []);

  useEffect(
    () => {
      if (seed) {
        setParam("s", seed);
      }
    },
    [seed]
  );

  // Fetch data
  useEffect(
    () => {
      if (!ready) {
        return;
      }
      fetch("data.tsv")
        .then(resp => resp.text())
        .then(data => {
          const dbData = processData(data);
          setDb(dbData);
        });
    },
    [ready]
  );

  useEffect(
    () => {
      setParam("a", reqAmount);
    },
    [reqAmount]
  );

  useEffect(
    () => {
      setParam("k", kidsOnly);
    },
    [kidsOnly]
  );

  useEffect(
    () => {
      setParam("v", vegOnly);
    },
    [vegOnly]
  );

  // Filter ids
  useEffect(
    () => {
      if (!db) {
        return;
      }
      setIds(
        Object.keys(db).filter(id => {
          const x = db[id];
          return (
            (kidsOnly ? x.tags.includes("c") : true) &&
            (vegOnly ? x.diet.includes("k") || x.diet.includes("ve") : true)
          );
        })
      );
    },
    [db, kidsOnly, vegOnly]
  );

  // Generate list
  useEffect(
    () => {
      if (!ready || !db) {
        return;
      }
      if (reqAmount < 1 || reqAmount > ids.length) {
        setChoices([]);
        return;
      }
      seedrandom(seed, { global: true });
      setChoices(sample(ids, reqAmount));
    },
    [seed, db, ready, reqAmount, kidsOnly, vegOnly, ids]
  );

  // Generate shopping list
  useEffect(
    () => {
      const items = {};
      choices.forEach(id => {
        const item = db[id];
        item.ingredients.forEach(x => {
          if (items[x]) {
            items[x] = items[x] + 1;
          } else {
            items[x] = 1;
          }
        });
      });
      const itemList = Object.keys(items);
      itemList.sort();
      setShopList(itemList.map(x => ({ name: x, amount: items[x] })));
      setBought({});
    },
    [choices, db]
  );

  const toggle = index => () => {
    setBought({
      ...bought,
      [shopList[index].name]: !bought[shopList[index].name]
    });
  };

  if (!ready) {
    return null;
  }

  return (
    <div>
      <h1>Ruokalista</h1>
      <label>
        Listan koko:
        <input
          type="number"
          min="0"
          max={db ? ids.length : 0}
          value={reqAmount}
          onChange={e => setReqAmount(Number(e.target.value))}
        />
        <button
          type="button"
          onClick={() => setReqAmount(Math.max(reqAmount - 1, 0))}
        >
          -
        </button>
        <button type="button" onClick={() => setReqAmount(reqAmount + 1)}>
          +
        </button>
      </label>
      <label>
        Lapsiystävällinen:
        <input
          type="checkbox"
          checked={kidsOnly}
          onChange={() => setKidsOnly(!kidsOnly)}
        />
      </label>
      <label>
        Vain vege:
        <input
          type="checkbox"
          checked={vegOnly}
          onChange={() => setVegOnly(!vegOnly)}
        />
      </label>
      <button type="button" onClick={() => setSeed(createSeed())}>
        ↻
      </button>
      <h2>Ruokalajit</h2>
      <div>
        <ol className="choices">
          {choices.map(id => {
            const item = db[id];
            return <li key={id}>{item.name}</li>;
          })}
        </ol>
      </div>
      {shopList.length > 0 ? (
        <>
          <h2>Ostoslista</h2>
          <div>
            <ol className="shopping">
              {shopList.map((x, i) => {
                return (
                  <li key={x.name}>
                    <button
                      type="button"
                      onClick={toggle(i)}
                      className={bought[x.name] ? "bought" : ""}
                    >
                      {x.name}
                      {x.amount > 1 ? ` (${x.amount})` : ""}
                      <span className="check"> ✔</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      ) : null}
    </div>
  );
};
