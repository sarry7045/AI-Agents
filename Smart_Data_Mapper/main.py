import streamlit as st
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import json
import yaml

class SmartDataMapper:
    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key:
            self.llm = ChatOpenAI(
                openai_api_key=api_key,
                model="gpt-3.5-turbo",
            ) # type: ignore
            # self.llm = ChatGoogleGenerativeAI(
            #     api_key=api_key,
            #     model="gemini-1.5-flash"
            # )

    def load_yaml_file(self, uploaded_file):
        print("uploaded_file", uploaded_file)
        try:
            if uploaded_file is not None:
                content = uploaded_file.read().decode('utf-8')
                data = yaml.safe_load(content)
                if isinstance(data, dict):
                    return list(data.keys()), data
                
                elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                 print("data", data)
                 return list(data[0].keys()), data
            
                else:
                    st.warning(
                        "YAML structure should be a dictionary at the top level.")
                    return [], {}
            else:
                return [], {}
        except Exception as e:
            st.error(f"Error loading YAML file: {str(e)}")
            return [], {}

    def generate_ai_mapping_prompt(self, source_columns, target_columns):
        prompt = f"""
You are an expert data analyst tasked with mapping columns between two datasets.

SOURCE DATASET COLUMNS ({len(source_columns)} columns):
{', '.join(str(source_columns))}

TARGET DATASET COLUMNS ({len(target_columns)} columns):
{', '.join(str(target_columns))}

TASK: For each TARGET column, find the best matching SOURCE column(s).

INSTRUCTIONS:
1. Consider column names, semantic meaning, and data patterns
2. Look for exact matches, partial matches, and conceptual matches
3. Consider common variations (e.g., 'id' vs 'identifier', 'num' vs 'number')
4. Rate confidence from 0.0 to 1.0
5. Provide reasoning for each mapping

OUTPUT FORMAT (JSON):
{{
  "mappings": [
    {{
      "target_column": "target_col_name",
      "source_column": "best_source_col_name",
      "confidence": 0.95,
      "reasoning": "Exact name match with similar data patterns"
    }}
  ]
}}

Only suggest mappings with confidence > 0.3. If no good match exists, skip that target column.
"""
        return prompt

    def get_ai_mappings(self, source_columns, target_columns):
        print("source_columns", source_columns)
        print("target_columns", target_columns)
        if not self.api_key:
            return []

        prompt = self.generate_ai_mapping_prompt(
            source_columns, target_columns)

        try:
            messages = [
                SystemMessage(
                    content="You are an expert data mapping assistant."),
                HumanMessage(content=prompt)
            ]

            response = self.llm.invoke(messages)
            print("response", response.content)

            json_start = response.content.find('{')
            json_end = response.content.rfind('}') + 1
            json_str = response.content[json_start:json_end]
            result = json.loads(json_str)
            print("result", result)

            mappings = []
            for mapping in result.get('mappings', []):
                mappings.append({
                    "target_column": mapping['target_column'],
                    "source_column": mapping['source_column'],
                    "confidence_score": mapping['confidence'],
                    "reasoning": mapping['reasoning']
                })
                print("mappings", mappings)

            return mappings

        except Exception as e:
            st.error(f"AI mapping failed: {str(e)}")
            return []


def main():
    st.set_page_config(
        page_title="Smart Data Mapper",
        page_icon="🧠",
        layout="wide"
    )
    st.title("Smart Data Mapper")
    st.markdown(
        "Automatically map columns between datasets using AI and rule-based matching")
    st.sidebar.header("Configuration")

    api_key = st.sidebar.text_input(
        "LLM API Key",
        type="password",
        help="Enter your LLM API key for AI-powered mapping. Leave empty for rule-based only."
    )

    mapper = SmartDataMapper(api_key)
    st.header("📁 Upload Your Datasets")

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Source Dataset (Large)")
        source_file = st.file_uploader("", type=['yaml', 'yml'], key="source")

    with col2:
        st.subheader("Target Dataset (Small)")
        target_file = st.file_uploader("", type=['yaml', 'yml'], key="target")

    if source_file and target_file:
        source_columns, source_data = mapper.load_yaml_file(source_file)
        target_columns, target_data = mapper.load_yaml_file(target_file)

        st.success(f"✅ Loaded source dataset: {len(source_columns)} columns")
        st.success(f"✅ Loaded target dataset: {len(target_columns)} columns")

        if st.button("🚀 Generate Mappings", type="primary"):
            with st.spinner("Analyzing datasets and generating mappings..."):
                ai_mappings = []

                if api_key:
                    ai_mappings = mapper.get_ai_mappings(
                        source_data, target_data)

                ai_mappings = [
                    m for m in ai_mappings if m['confidence_score'] >= 0.3]
                ai_mappings.sort(
                    key=lambda x: x['confidence_score'], reverse=True)

            st.header("📋 Mapping Results")

            if ai_mappings:
                st.success(f"Found {len(ai_mappings)} potential mappings!")

                results_df = [{
                    "Target Column": m["target_column"],
                    "Source Column": m["source_column"],
                    "Confidence": f"{m['confidence_score']:.2f}",
                    "Reasoning": m["reasoning"]
                } for m in ai_mappings]

                st.dataframe(results_df, use_container_width=True)
            else:
                st.warning(
                    "No mappings found with the current confidence threshold.")


if __name__ == "__main__":
    main()
