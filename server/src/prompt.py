class JobSeachPrompt:
    def load_system_prompt(self, job_title, experience, professional_summary):
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
                    
                    "employer_name": "The San Francisco Compute Company",
                    "employer_logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnL55P3o_Ot5_9IdIIOdh-f97gNPBoo_4QcJCD&s=0",
                    "employer_website": "https://sfcompute.com",
                    
                    "job_min_salary": 175000,
                    "job_max_salary": 230000,
                    "job_salary_period": "YEAR",
                    "job_posted_at": "13 hours ago"
                    
                    "extraction_note": "Included because the job title matches the candidate's desired role and required experience aligns with their professional background."
                }}
            ]

            Please ensure that your response for each job fills out each field as accurately as possible. Leave the value None if the information is not available.

            In addition, you must prioritize and extract job listings that are most relevant to the following candidate context:

            - Desired job title: {job_title}
            - Experience level: {experience}
            - Professional summary: {professional_summary}

            Consider the provided parameters when extracting and ranking the job listings: 
            Only include jobs that match or are highly related to the candidate's title, 
            are suitable for their experience level, and fit the type of roles likely to match the professional summary. 
            Explain your rationale for inclusion in a brief comment in each job listing's object as 'extraction_note' if possible.
        """
        return {"role": "system", "content": content}

    def load_user_prompt(self, job_listings):
        content = (
            "Here are the raw job search results in JSON format:\n\n"
            f"{job_listings}\n\n"
            "Please process these listings according to the system instructions."
        )
        return {"role": "user", "content": content}
