class JobSeachPrompt:
    PROMPT_PATH = (
        "src/prompts/job_search.md"
    )

    def load_system_prompt(self, resume_text):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(resume_text=resume_text)
        return {"role": "system", "content": content}

    def load_user_prompt(self, job_listings):
        content = (
            "Here are the raw job search results in JSON format:\n\n"
            f"{job_listings}\n\n"
            "Please process these listings according to the system instructions."
        )
        return {"role": "user", "content": content}



class EmployerInsightsPrompt:
    PROMPT_PATH = (
        "src/prompts/employer_insights.md"
    )

    def load_system_prompt(self, employer_website_context: str):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(employer_website_context=employer_website_context)
        return {"role": "system", "content": content}

    def load_user_prompt(self):
        return {
            "role": "user",
            "content": "Please generate the employer insights.",
        }

class JobQueryPrompt:
    PROMPT_PATH = (
        "src/prompts/job_query.md"
    )

    def load_system_prompt(self) -> str:
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()
        return template

class TailorResumePrompt:
    PROMPT_PATH = (
        "src/prompts/tailor_resume.md"
    )

    def load_system_prompt(self, resume_text: str, job_title: str, job_description: str, employer_name: str | None):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(
            resume_text=resume_text,
            job_title=job_title,
            job_description=job_description,
            employer_name=employer_name or "Unknown"
        )
        return {"role": "system", "content": content}

    def load_user_prompt(self):
        return {
            "role": "user",
            "content": "Please tailor my resume for this role. Output only the requested JSON.",
        }
