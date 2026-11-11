import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrontDeskIntake } from './front-desk-intake';

describe('FrontDeskIntake', () => {
  let component: FrontDeskIntake;
  let fixture: ComponentFixture<FrontDeskIntake>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontDeskIntake],
    }).compileComponents();

    fixture = TestBed.createComponent(FrontDeskIntake);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
