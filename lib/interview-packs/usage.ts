type Pricing = {
  inputCostPerMillionGbp: number;
  outputCostPerMillionGbp: number;
};

type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

const defaultPricingByModel: Record<string, Pricing> = {
  "gpt-4.1-mini": {
    // TODO: Review these pricing defaults before launch if your production model changes.
    inputCostPerMillionGbp: 0.32,
    outputCostPerMillionGbp: 1.28,
  },
};

function getConfiguredPricing(model: string): Pricing | null {
  const inputOverride = process.env.OPENAI_INPUT_COST_PER_MILLION_GBP;
  const outputOverride = process.env.OPENAI_OUTPUT_COST_PER_MILLION_GBP;

  if (inputOverride && outputOverride) {
    const input = Number(inputOverride);
    const output = Number(outputOverride);

    if (Number.isFinite(input) && Number.isFinite(output)) {
      return {
        inputCostPerMillionGbp: input,
        outputCostPerMillionGbp: output,
      };
    }
  }

  return defaultPricingByModel[model] ?? null;
}

export function estimateUsageCostGbp(model: string, usage: Usage) {
  const pricing = getConfiguredPricing(model);

  if (!pricing) {
    return 0;
  }

  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputCostPerMillionGbp;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputCostPerMillionGbp;

  return Number((inputCost + outputCost).toFixed(6));
}
