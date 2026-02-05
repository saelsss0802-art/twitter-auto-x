export type PostType = {
  id: string;
  name: string;
  purpose: string;
  structureHint: string;
  tips: string;
};

export const postTypes: PostType[] = [
  {
    id: 'awareness',
    name: '認知',
    purpose: '存在や価値を軽く伝えて興味を引く。',
    structureHint: '短い導入→気づき→一文で締める。',
    tips: '専門用語は避け、身近な例で共感を作る。',
  },
  {
    id: 'authority',
    name: '権威',
    purpose: '実績や経験を示して信頼を高める。',
    structureHint: '実績提示→学び→結論。',
    tips: '数字や固有名詞で具体性を出す。',
  },
  {
    id: 'ideal',
    name: '理想',
    purpose: '目指す状態や未来像を描いて期待を作る。',
    structureHint: '理想の描写→現在との差→一言。',
    tips: '未来の情景を具体的に描写する。',
  },
  {
    id: 'engagement',
    name: '交流',
    purpose: '会話を生みエンゲージメントを高める。',
    structureHint: '問いかけ→自分の一言→再度問い。',
    tips: '質問は1つに絞り、答えやすくする。',
  },
  {
    id: 'fan',
    name: 'ファン化',
    purpose: '人柄や価値観を伝え、親近感を作る。',
    structureHint: '体験→感情→学び。',
    tips: '弱みや小さな気づきを入れる。',
  },
  {
    id: 'education',
    name: '教育',
    purpose: '役立つ知識を簡潔に伝える。',
    structureHint: '結論→理由→具体例。',
    tips: '1ツイートに1ポイントだけ。',
  },
  {
    id: 'cta',
    name: '行動喚起',
    purpose: '次のアクションへ自然に促す。',
    structureHint: '価値→行動→締め。',
    tips: '行動を1つに絞り、負担を軽くする。',
  },
  {
    id: 'algorithm',
    name: 'アルゴリズム',
    purpose: 'Xの伸びやすさに関する示唆を届ける。',
    structureHint: '観察→解釈→実践。',
    tips: '抽象論ではなく具体アクションで締める。',
  },
];

export const listPostTypes = () => postTypes;

export const getPostTypeById = (typeId: string) => postTypes.find((type) => type.id === typeId) ?? null;
