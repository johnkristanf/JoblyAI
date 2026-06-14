class JobSeachPrompt:
    PROMPT_PATH = (
        "src/prompts/job_search.md"
    )

    def load_system_prompt(self, extracted_resume_fields):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(extracted_resume_fields=extracted_resume_fields)
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


class TailorResumePrompt:
    PROMPT_PATH = (
        "src/prompts/tailor_resume.md"
    )

    def load_system_prompt(self, extracted_resume: dict, job_title: str, job_description: str, employer_name: str | None):
        import json as _json
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(
            extracted_resume=_json.dumps(extracted_resume, indent=2),
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


class ResumeExtractionPrompt:
    PROMPT_PATH = (
        "src/prompts/resume_extraction.md"
    )

    def load_system_prompt(self, resume_text: str):
        with open(self.PROMPT_PATH, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(resume_text=resume_text)
        return {"role": "system", "content": content}

    def load_user_prompt(self):
        return {
            "role": "user",
            "content": (
                "Please extract the contact details, professional summary, work experience, "
                "skills, and education from the resume above. "
                "Output only the raw JSON object — no markdown, no explanation."
            ),
        }


class MockInterviewPrompt:
    _PROMPT_PATHS: dict[str, str] = {
        "HR_SCREENING": "src/prompts/interview/hr_screening.md",
        "TECHNICAL":    "src/prompts/interview/technical.md",
        "BEHAVIORAL":   "src/prompts/interview/behavioral.md",
    }
    # Fallback for unknown types
    _DEFAULT_TYPE = "BEHAVIORAL"

    def load_system_prompt(self, job_title: str, employer_name: str, interview_type: str = "BEHAVIORAL") -> dict:
        path = self._PROMPT_PATHS.get(interview_type.upper(), self._PROMPT_PATHS[self._DEFAULT_TYPE])
        with open(path, "r", encoding="utf-8") as f:
            template = f.read()

        content = template.format(
            job_title=job_title or "the open position",
            employer_name=employer_name or "our company",
        )
        return {"role": "system", "content": content}

    def load_greeting_prompt(self) -> dict:
        return {
            "role": "user",
            "content": "Please start the interview now by greeting the candidate and asking your first question.",
        }


class InterviewGraderPrompt:
    _PROMPT_PATHS: dict[str, str] = {
        "HR_SCREENING": "src/prompts/grader/hr_screening.md",
        "TECHNICAL":    "src/prompts/grader/technical.md",
        "BEHAVIORAL":   "src/prompts/grader/behavioral.md",
    }
    _DEFAULT_TYPE = "BEHAVIORAL"

    def load_system_prompt(
        self,
        interview_type: str,
        job_title: str,
        employer: str,
        resume_text: str,
        transcript_text: str,
    ) -> str:
        path = self._PROMPT_PATHS.get(interview_type.upper(), self._PROMPT_PATHS[self._DEFAULT_TYPE])
        with open(path, "r", encoding="utf-8") as f:
            template = f.read()

        return template.format(
            job_title=job_title or "Not specified",
            employer=employer or "Not specified",
            resume_text=resume_text or "No resume provided.",
            transcript_text=transcript_text,
        )

