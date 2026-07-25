from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        success = True
        if response and response.status_code >= 400:
            success = False
            
        message = ""
        errors = {}
        payload = data
        
        if isinstance(data, dict):
            message = data.pop('message', "")
            if 'detail' in data:
                message = data.pop('detail')
            
            if not success:
                errors = data
                payload = None
                if not message:
                    message = "An error occurred."
            else:
                if 'data' in data and len(data) == 1:
                    payload = data['data']
        
        formatted_data = {
            "success": success,
            "message": message,
        }
        if success:
            formatted_data["data"] = payload
        else:
            formatted_data["errors"] = errors
            
        return super().render(formatted_data, accepted_media_type, renderer_context)
