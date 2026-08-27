import requests
from bs4 import BeautifulSoup

from langchain.tools import tool


BASE_URL = "https://www.geu.ac.in"


def fetch_webpage_content(url: str) -> str:

    try:

        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        # Remove unnecessary HTML tags
        for tag in soup([
            "script",
            "style",
            "nav",
            "footer",
            "header"
        ]):
            tag.decompose()

        text = soup.get_text(separator=" ")

        cleaned_text = " ".join(text.split())

        return cleaned_text[:6000]

    except Exception as e:

        return f"Error fetching webpage: {e}"


@tool
def admission_search_tool() -> str:
    """
    Get GEU admission information.
    """

    url = f"{BASE_URL}/content/geu/en/admissions.html"

    return fetch_webpage_content(url)


@tool
def placement_search_tool() -> str:
    """
    Get GEU placement information.
    """

    url = f"{BASE_URL}/content/geu/en/placements.html"

    return fetch_webpage_content(url)


@tool
def courses_search_tool() -> str:
    """
    Get GEU course information.
    """

    url = f"{BASE_URL}/content/geu/en/programmes.html"

    return fetch_webpage_content(url)


@tool
def about_geu_tool() -> str:
    """
    Get information about Graphic Era University.
    """

    url = f"{BASE_URL}/content/geu/en/about.html"

    return fetch_webpage_content(url)


@tool
def hostel_info_tool() -> str:
    """
    Get GEU hostel information.
    """

    url = f"{BASE_URL}/content/geu/en/facilities/hostel.html"

    return fetch_webpage_content(url)


@tool
def scholarship_tool() -> str:
    """
    Get GEU scholarship information.
    """

    url = f"{BASE_URL}/content/geu/en/admissions/scholarships.html"

    return fetch_webpage_content(url)


@tool
def contact_tool() -> str:
    """
    Get GEU contact details.
    """

    url = f"{BASE_URL}/content/geu/en/contact-us.html"

    return fetch_webpage_content(url)


@tool
def faculty_tool() -> str:
    """
    Get GEU faculty information.
    """

    url = f"{BASE_URL}/content/geu/en/faculty.html"

    return fetch_webpage_content(url)


# ============================================================
# TOOL 9 : CAMPUS FACILITIES
# ============================================================

@tool
def campus_facilities_tool() -> str:
    """
    Get GEU campus facilities information.
    """

    url = f"{BASE_URL}/content/geu/en/facilities.html"

    return fetch_webpage_content(url)


@tool
def research_tool() -> str:
    """
    Get GEU research information.
    """

    url = f"{BASE_URL}/content/geu/en/research.html"

    return fetch_webpage_content(url)


@tool
def sports_tool() -> str:
    """
    Get GEU sports information.
    """

    url = f"{BASE_URL}/content/geu/en/sports.html"

    return fetch_webpage_content(url)


@tool
def international_programs_tool() -> str:
    """
    Get GEU international program information.
    """

    url = f"{BASE_URL}/content/geu/en/international-affairs.html"

    return fetch_webpage_content(url)



def tool_router(user_query: str) -> str:

    query = user_query.lower()

    if "admission" in query:
        return admission_search_tool.invoke("")

    elif "placement" in query:
        return placement_search_tool.invoke("")

    elif "course" in query:
        return courses_search_tool.invoke("")

    elif "hostel" in query:
        return hostel_info_tool.invoke("")

    elif "scholarship" in query:
        return scholarship_tool.invoke("")

    elif "contact" in query:
        return contact_tool.invoke("")

    elif "faculty" in query:
        return faculty_tool.invoke("")

    elif "facility" in query:
        return campus_facilities_tool.invoke("")

    elif "research" in query:
        return research_tool.invoke("")

    elif "sports" in query:
        return sports_tool.invoke("")

    elif "international" in query:
        return international_programs_tool.invoke("")

    elif (
        "graphic era" in query
        or "about" in query
        or "university" in query
    ):
        return about_geu_tool.invoke("")

    else:
        return (
            "No matching tool found.\n"
            "Try asking about:\n"
            "- admissions\n"
            "- placements\n"
            "- courses\n"
            "- hostel\n"
            "- scholarships\n"
            "- faculty\n"
            "- research\n"
            "- sports\n"
            "- facilities\n"
            "- international programs"
        )



if __name__ == "__main__":

    print("\n=== GEU WEBSITE TOOL CALLING SYSTEM ===")

    while True:

        query = input("\nYou: ")

        if query.lower() == "exit":
            break

        result = tool_router(query)

        print("\nTool Response:\n")

        print(result[:4000])