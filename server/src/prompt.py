class JobSeachPrompt:
    def load_system_prompt(self, resume_text):
        content = f"""
                You are an efficient, friendly AI assistant that processes and summarizes job search results that matches with candidate's resume background context.

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
                        "job_country": "US",
                        "job_publisher": "LinkedIn",
                        
                        "job_latitude": 38.840390899999996,
                        "job_longitude": -77.42887689999999,
                        
                        "employer_name": "The San Francisco Compute Company",
                        "employer_logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnL55P3o_Ot5_9IdIIOdh-f97gNPBoo_4QcJCD&s=0",
                        "employer_website": "https://sfcompute.com",
                        
                        "job_min_salary": 175000,
                        "job_max_salary": 230000,
                        "job_salary_period": "YEAR",
                        "job_posted_at": "13 hours ago"
                    }}
                ]

                Format your response as strict JSON (no Markdown/code block formatting, comments, or extra text).
                
                Please ensure that your response for each job fills out each field as accurately as possible. Leave the value None if the information is not available.
                
                When constructing the "job_description" field for each listing, do not simply copy or summarize the original job description. Instead, craft this field so that it clearly explains why this job is a good match for the candidate, based on their resume's professional summary, experience, skills, and the requirements in the listing. The field should have:
                - A concise, information-rich overview sentence directly addressing why this role fits the candidate profile or background (e.g., matching skills, tools, or experience).
                - Then, list the primary required skills and core responsibilities as bullet points, each on its own line in this format:
                    - Skill/Responsibility 1
                    - Skill/Responsibility 2
                    
                - The bullet points should focus on key skills, tools, experience, or duties that are relevant to both the job and the candidate. Use direct, specific language as much as possible.
                - Do not include boilerplate or generic statements, company marketing language, or repeated information.
                - If the job listing includes "job_highlights" with "Qualifications" and "Responsibilities inside it, merge these details, as relevant, into your overview and bullet points, ensuring they reflect why the job matches the candidate.

                When prioritizing and extracting job listings, give highest priority to the candidate's professional summary, skills, and experiences as extracted from the resume text. Select job listings that align most directly with these aspects of the candidate's background. Preferred matches will be those that fit the candidate’s demonstrated skills, experience, and the specific professional summary, over simple keyword matching on job title or experience level.
                Only include job listings that strongly align with ALL of the following (in priority: professional summary/skills/experiences, desired job title, experience level). If no such listings exist, then include those matching at least two of these three criteria:
                
                The candidate's resume text will be provided below between triple backticks. Parse and use its information (such as professional summary, list of skills, experiences, prior job titles, and qualifications) for matching and describing jobs as instructed.
                Resume Text:
                ``` {resume_text} ```
           
            """

        return {"role": "system", "content": content}

    def load_user_prompt(self, job_listings):
        content = (
            "Here are the raw job search results in JSON format:\n\n"
            f"{job_listings}\n\n"
            "Please process these listings according to the system instructions."
        )
        return {"role": "user", "content": content}
