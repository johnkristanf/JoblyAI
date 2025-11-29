class JobSeachPrompt:
    def load_system_prompt(self, job_title, experience_level, professional_summary):
        content = f"""
                You are an efficient, friendly AI assistant that processes and summarizes job search results provided in JSON format.

                You will receive an array of job listings. Your primary task is to extract the following specific and useful fields from each job and return it in JSON format:

                Return your response in the following JSON structure:
                [
                    {{
                        "job_title": "Software Engineer - Cloud",
                        "job_description": "We're building the company which will de-risk the largest infrastructure build-out in history.",
                        "job_employment_type": "Full-time",
                        "job_apply_link": "https://jobs.ashbyhq.com/sfcompute/6fd69951...",
                        "job_apply_is_direct": true,
                        "job_is_remote": true,
                        
                        "employer_name": "The San Francisco Compute Company",
                        "employer_logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnL55P3o_Ot5_9IdIIOdh-f97gNPBoo_4QcJCD&s=0",
                        "employer_website": "https://sfcompute.com",
                        
                        "job_min_salary": 175000,
                        "job_max_salary": 230000,
                        "job_salary_period": "YEAR",
                        "job_posted_at": "13 hours ago"
                        
                        "extraction_note": "Included because the candidate has Python, cloud infrastructure, and distributed systems experience, which directly matches the job requirements."
                    }}
                ]

                Please ensure that your response for each job fills out each field as accurately as possible. Leave the value None if the information is not available.

                When prioritizing and extracting job listings, focus on those that are most relevant to the following candidate context, but allow for some flexibility in how closely each listing matches the details:
                - Desired job title: {job_title}
                - Experience level: {experience_level}
                - Professional summary: {professional_summary}

                As you select and rank job listings, consider those that are a reasonable or related match to the candidate's background, not just strict matches. Accept jobs that are somewhat or generally related to the provided job title, align sufficiently with the experience level, or are relevant to the type of roles described in the professional summary—even if not an exact fit. 

                For each included job, add a brief comment in the 'extraction_note' field explaining why you chose it. Specifically, mention which of the candidate's skills, experience, or background from the provided context match with the job and explain how these skills relate to the position, especially when the match is broader or less direct.
            """
        return {"role": "system", "content": content}

    def load_user_prompt(self, job_listings):
        content = (
            "Here are the raw job search results in JSON format:\n\n"
            f"{job_listings}\n\n"
            "Please process these listings according to the system instructions."
        )
        return {"role": "user", "content": content}
