import pandas as pd
import json
import os

def process_excel_to_json(excel_path, output_path):
    """
    Convert Excel file with questions to JSON format for database import
    """
    try:
        # Read the Excel file into a pandas DataFrame
        print(f"Reading Excel file: {excel_path}")
        df = pd.read_excel(excel_path)
        
        # Print column names for debugging
        print(f"Columns in the file: {df.columns.tolist()}")
        
        # Count number of rows
        print(f"Number of questions: {len(df)}")
        
        # Convert DataFrame to list of dictionaries (records)
        questions = df.to_dict(orient='records')
        
        # Clean up NaN values
        for q in questions:
            for key, value in q.items():
                if pd.isna(value):
                    q[key] = None
        
        # Save as JSON
        with open(output_path, 'w') as f:
            json.dump(questions, f, indent=2)
        
        print(f"Successfully converted to JSON. Output saved to: {output_path}")
        return True
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
        return False

if __name__ == "__main__":
    excel_path = "./attached_assets/master question set.xlsx"
    output_path = "./temp_extraction/questions.json"
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    process_excel_to_json(excel_path, output_path)