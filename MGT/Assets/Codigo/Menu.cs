using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
public class Menu : MonoBehaviour
{
    public float VelocidadFondo;
    public RawImage Fondo;
    void Start()
    {
        
    }
    void Update()
    {
        float VelocidadFinal = VelocidadFondo * Time.deltaTime;
        Fondo.uvRect = new Rect(Fondo.uvRect.x + VelocidadFinal, 0f, 1f, 1f);
    }
}