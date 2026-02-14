import subprocess
import re
from datetime import datetime

def generate_history():
    # Git log command to get details with stats
    # We use a custom separator for parsing
    cmd = ['git', 'log', '--reverse', '--date=short', '--pretty=format:COMMIT_START%n%H%n%an%n%ad%n%s%n%b%nCOMMIT_BODY_END', '--stat']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        if result.returncode != 0:
            print(f"Error running git log: {result.stderr}")
            return
            
        raw_log = result.stdout
        
        # Split by COMMIT_START
        commits = raw_log.split('COMMIT_START')
        
        markdown_content = "# Comprehensive Project Commit History\n\n"
        markdown_content += "This document provides a detailed historical record of all commits in the repository, chronologically ordered.\n\n"
        
        commit_count = 0
        
        for commit_raw in commits:
            if not commit_raw.strip():
                continue
                
            commit_count += 1
            lines = commit_raw.strip().split('\n')
            
            # Parsing header
            if len(lines) < 5:
                continue
                
            commit_hash = lines[0].strip()
            author = lines[1].strip()
            date = lines[2].strip()
            subject = lines[3].strip()
            
            # Extract body and stats
            # Find where COMMIT_BODY_END is
            try:
                body_end_index = lines.index('COMMIT_BODY_END')
                body = '\n'.join(lines[4:body_end_index]).strip()
                stats = '\n'.join(lines[body_end_index+1:]).strip()
            except ValueError:
                body = ""
                stats = ""

            # Formatting the section
            markdown_content += f"## {commit_count}. {subject}\n\n"
            markdown_content += f"**Commit Hash:** `{commit_hash}`  \n"
            markdown_content += f"**Author:** {author}  \n"
            markdown_content += f"**Date:** {date}  \n\n"
            
            markdown_content += "### 📝 Description & Impact\n"
            if body:
                markdown_content += f"{body}\n\n"
            else:
                markdown_content += f"{subject}\n\n"
            
            # Add some interpretive text based on keywords (simple heuristic to add value)
            markdown_content += "**Context:**\n"
            if "fix" in subject.lower():
                markdown_content += "- **Type:** Bug Fix\n"
            elif "feat" in subject.lower() or "add" in subject.lower():
                markdown_content += "- **Type:** New Feature/Enhancement\n"
            elif "merge" in subject.lower():
                markdown_content += "- **Type:** Merge/Integration\n"
            elif "docs" in subject.lower():
                markdown_content += "- **Type:** Documentation\n"
            elif "chore" in subject.lower() or "bump" in subject.lower():
                markdown_content += "- **Type:** Maintenance/Dependency Update\n"
            else:
                markdown_content += "- **Type:** Code Change\n"
                
            markdown_content += "\n"
            
            markdown_content += "### 📂 Changed Files\n"
            if stats:
                markdown_content += "```text\n"
                markdown_content += stats
                markdown_content += "\n```\n\n"
            else:
                markdown_content += "_No file stats available._\n\n"
            
            markdown_content += "---\n\n"
            
        with open('detailed_project_history.md', 'w', encoding='utf-8') as f:
            f.write(markdown_content)
            
        print(f"Successfully processed {commit_count} commits into detailed_project_history.md")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    generate_history()
