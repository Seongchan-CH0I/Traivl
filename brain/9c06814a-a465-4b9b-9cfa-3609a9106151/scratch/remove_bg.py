from PIL import Image

try:
    img = Image.open(r"c:\Traivl\Traivl\front_backend\public\images\logo.png")
    img = img.convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    # We replace beige/off-white background pixels (high RGB values, slightly warm) with pure white.
    for item in datas:
        # Check if pixel color is close to the off-white/beige background
        # Usually R, G, B > 225 and very close to each other
        r, g, b, a = item
        if r > 225 and g > 225 and b > 218:
            newData.append((255, 255, 255, 255))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(r"c:\Traivl\Traivl\front_backend\public\images\logo.png", "PNG")
    print("SUCCESS: Logo background converted to pure white.")
except Exception as e:
    print("ERROR:", str(e))
