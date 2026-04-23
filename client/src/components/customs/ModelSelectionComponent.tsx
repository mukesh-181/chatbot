import type { AIModelId, AIModelOption } from "@/lib/aiModels";

type ModelSelectionComponentProps = {
  availableModels: AIModelOption[];
  selectedModel: AIModelId;
  loading: boolean;
  onModelChange: (modelId: AIModelId) => void;
};

const ModelSelectionComponent = ({
  availableModels,
  selectedModel,
  loading,
  onModelChange,
}: ModelSelectionComponentProps) => {
  return (
    <div className="mb-4 flex justify-end">
      <div className="relative">
        <span className="absolute -top-2 left-3 px-1 text-xs bg-white dark:bg-gray-900 text-gray-500">
          Model
        </span>

        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={loading || availableModels.length === 0}
          className="appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white rounded-full px-4 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          ▼
        </div>
      </div>
    </div>
  );
};

export default ModelSelectionComponent;
