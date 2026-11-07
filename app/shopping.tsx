'use client';

import {useState} from 'react';
import {ArrowUpRight, Blocks, Search, Shirt, X} from 'lucide-react';
import {
  filterShoppingChannels, shoppingCategories, shoppingChannels,
  type ShoppingCategory, type ShoppingRegion,
} from '../lib/shopping';
import './shopping.css';

const regions = [['all', '全部渠道'], ['domestic', '国内渠道'], ['overseas', '海外渠道']] as const;
const categories = [['all', '全部周边'], ...Object.entries(shoppingCategories)] as [ShoppingCategory | 'all', string][];
const featuredIds = ['f1-store', 'puma', 'lego'];

export function ShoppingDirectory() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<ShoppingRegion | 'all'>('all');
  const [category, setCategory] = useState<ShoppingCategory | 'all'>('all');
  const channels = filterShoppingChannels(shoppingChannels, {query, region, category});
  const filtered = Boolean(query || region !== 'all' || category !== 'all');
  const displayChannels = filtered ? channels : [
    ...featuredIds.flatMap(id => channels.filter(channel => channel.id === id)),
    ...channels.filter(channel => !featuredIds.includes(channel.id)),
  ];

  function resetFilters() {
    setQuery('');
    setRegion('all');
    setCategory('all');
  }

  return <section className="shopping-directory" aria-label="F1 周边购买渠道">
    <div className="shopping-controls">
      <div className="shopping-toolbar">
        <div className="segmented shopping-regions" role="group" aria-label="渠道地区">
          {regions.map(([value, label]) => <button key={value} type="button" className={region === value ? 'selected' : ''} aria-pressed={region === value} onClick={() => setRegion(value)}>{label}</button>)}
        </div>
        <label className="shopping-search">
          <Search size={18} aria-hidden="true"/>
          <input type="search" aria-label="搜索购买渠道" placeholder="搜索品牌、车队、周边" value={query} onChange={event => setQuery(event.target.value)}/>
        </label>
      </div>
      <div className="shopping-filter-row">
        <div className="shopping-categories" role="group" aria-label="周边类型">
          {categories.map(([value, label]) => <button key={value} type="button" className={category === value ? 'selected' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}
        </div>
        {filtered && <button className="shopping-reset" type="button" onClick={resetFilters}><X size={14} aria-hidden="true"/>清除筛选</button>}
      </div>
    </div>

    <div className="shopping-channel-grid" aria-label="购买渠道">
      {displayChannels.map(channel => <article className="shopping-channel" key={channel.id} data-channel={channel.id} data-featured={!filtered && featuredIds.includes(channel.id)}>
        <a className="shopping-visit" href={channel.url} target="_blank" rel="noopener noreferrer" aria-label={'前往' + channel.name}>
          <span className="shopping-channel-mark" aria-hidden="true">{channel.mark}</span>
          <div className="shopping-channel-copy">
            <span className="shopping-channel-identity">{channel.identity}</span>
            <h3>{channel.name}</h3>
            <p>{channel.description}</p>
            <span className="shopping-product-types">{channel.categories.map(value => <span key={value}>{shoppingCategories[value]}</span>)}</span>
          </div>
          <span className="shopping-open"><ArrowUpRight size={20} aria-hidden="true"/></span>
          {!filtered && channel.id === 'f1-store' && <div className="shopping-feature-art shopping-race-art" aria-hidden="true"><span>F1</span><img src="/cars/mclaren.png" alt="" width={1024} height={224}/></div>}
          {!filtered && channel.id === 'puma' && <Shirt className="shopping-feature-art shopping-shirt-art" strokeWidth={0.8} aria-hidden="true"/>}
          {!filtered && channel.id === 'lego' && <Blocks className="shopping-feature-art shopping-brick-art" strokeWidth={0.8} aria-hidden="true"/>}
        </a>
      </article>)}
    </div>

    {channels.length === 0 && <div className="shopping-empty">
      <h3>没有符合条件的渠道</h3>
      <button className="small-button" type="button" onClick={resetFilters}>查看全部渠道</button>
    </div>}

  </section>;
}
