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


class InterviewProcessPrompt:
    PROMPT_PATH = (
        "src/prompts/interview_process.md"
    )

    def load_system_prompt(self, job_data: dict):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(job_data=job_data)
        return {"role": "system", "content": content}

    def load_user_prompt(self):
        return {
            "role": "user",
            "content": "Please generate the interview process guide for this specific job.",
        }
