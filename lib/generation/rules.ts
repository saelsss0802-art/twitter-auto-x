type AccountType = 'adult' | 'info_product' | (string & {});

type PersonaInput = {
  forbidden_words?: string[];
};

type DraftInput = {
  content: string;
};

export type AccountTypeRuleResult = {
  draft: DraftInput;
  warnings: string[];
  requirements: string[];
  appliedRules: string[];
};

type RuleContext = {
  persona?: PersonaInput;
  draft: DraftInput;
};

type AccountRule = (context: RuleContext) => AccountTypeRuleResult;

const baseResult = (draft: DraftInput): AccountTypeRuleResult => ({
  draft,
  warnings: [],
  requirements: [],
  appliedRules: [],
});

const adultRules: AccountRule = ({ draft }) => ({
  ...baseResult(draft),
  appliedRules: ['adult:placeholder'],
});

const infoProductRules: AccountRule = ({ draft }) => ({
  ...baseResult(draft),
  appliedRules: ['info_product:placeholder'],
});

const defaultRules: AccountRule = ({ draft }) => baseResult(draft);

const RULES_BY_ACCOUNT_TYPE: Record<string, AccountRule> = {
  adult: adultRules,
  info_product: infoProductRules,
};

export const applyAccountTypeRules = ({
  accountType,
  persona,
  draft,
}: {
  accountType?: AccountType;
  persona?: PersonaInput;
  draft: DraftInput;
}): AccountTypeRuleResult => {
  const rule = accountType ? RULES_BY_ACCOUNT_TYPE[accountType] ?? defaultRules : defaultRules;
  return rule({ persona, draft });
};
