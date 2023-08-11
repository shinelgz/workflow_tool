/**
 * 
 * @param title 
 * @param description 
 * @param button 
 * @param link 
 * @returns 
 */ 
export function interactiveCardMessage(title: string, description: string, button: string, link: string){
    return {
        "tag": "interactive_message",
        "interactive_message": {
            "default": {
                "elements": [
                    {
                        "element_type": "title",
                        "title": {
                            "text": title
                        }
                    },
                    {
                        "element_type": "description",
                        "description": {
                            "text": description
                        }
                    },
                    {
                        "element_type": "button",
                        "button": {
                            "button_type": "redirect",
                            "text": button,
                            "mobile_link": {
                                "type": "web",
                                "path": link
                            },
                            "desktop_link": {
                                "type": "web",
                                "path": link
                            }
                        }
                    },
                ]
            }
        }
    }
}